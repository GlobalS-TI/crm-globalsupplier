-- Migration: lectura de análisis para integraciones (THÖREN) + switch de datos de contacto
-- Sprint: Reportes comerciales — fase C
--
-- THÖREN necesita leer oportunidades de TODAS las unidades para analizarlas y generar
-- recomendaciones, sin poder modificar nada. La API de escritura (ADR-007) sigue igual:
-- limitada a su unidad y a lo que él creó.
--
-- - can_read_analytics: habilita la lectura de análisis (todas las unidades, sólo lectura).
-- - can_read_contact_pii: además expone email, teléfono y celular de los contactos.
--   Apagado, esos campos salen null.
-- Ambos apagados por defecto. Los cambia director_general o administracion desde la app
-- (/integraciones) con integration_set_permissions(); queda registrado quién y cuándo.

alter table public.integration_clients
  add column can_read_analytics     boolean not null default false,
  add column can_read_contact_pii   boolean not null default false,
  add column permissions_updated_by uuid references public.profiles(id),
  add column permissions_updated_at timestamptz;

-- ── Switch desde la app ──────────────────────────────────────────
-- integration_clients no tiene política de UPDATE para authenticated (keys, dueño y
-- límites sólo desde el SQL editor). Esta función es la única puerta de la app y sólo
-- toca los dos flags.
create or replace function public.integration_set_permissions(
  p_client_id            uuid,
  p_can_read_analytics   boolean,
  p_can_read_contact_pii boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (public.is_director_general() or public.is_admin()) then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  update public.integration_clients
  set can_read_analytics     = p_can_read_analytics,
      can_read_contact_pii   = p_can_read_contact_pii,
      permissions_updated_by = auth.uid(),
      permissions_updated_at = now()
  where id = p_client_id;

  if not found then
    raise exception 'Integración no encontrada' using errcode = 'P0002';
  end if;
end;
$$;

-- ── Filtros ──────────────────────────────────────────────────────
-- Mismos filtros que /reportes (OpportunityFilters en TypeScript, serializado a jsonb por
-- IntegrationRepository). Llaves ausentes = sin filtro.
create or replace function public.integration_analytics_match(o public.opportunities, p jsonb)
returns boolean
language sql
stable
set search_path = public
as $$
  select (p->>'owner_id'       is null or o.owner_id      = (p->>'owner_id')::uuid)
     and (p->>'business_unit'  is null or o.business_unit = (p->>'business_unit')::public.business_unit)
     and (p->'stages'          is null or o.etapa::text in (select jsonb_array_elements_text(p->'stages')))
     and (p->>'created_from'   is null or o.created_at   >= (p->>'created_from')::timestamptz)
     and (p->>'created_before' is null or o.created_at   <  (p->>'created_before')::timestamptz)
     and (p->>'closed_from'    is null or o.closed_at    >= (p->>'closed_from')::timestamptz)
     and (p->>'closed_before'  is null or o.closed_at    <  (p->>'closed_before')::timestamptz)
     and (coalesce((p->>'next_activity_missing')::boolean, false) = false or o.next_activity_at is null)
     and (p->>'next_activity_before' is null or o.next_activity_at < (p->>'next_activity_before')::timestamptz)
     and (p->>'stale'          is null or o.stale        = (p->>'stale')::boolean);
$$;

-- ── Lectura de análisis ──────────────────────────────────────────
-- Devuelve { total, rows } con las oportunidades que cumplen los filtros, de cualquier
-- unidad. p_limit null = todas (lo usa el cálculo de indicadores; < 1,000 oportunidades
-- en fase 1). Nunca escribe nada salvo la bitácora, que también alimenta el rate limit.
create or replace function public.integration_analytics_opportunities(
  p_key_hash  text,
  p_operacion text,
  p_filters   jsonb   default '{}'::jsonb,
  p_limit     integer default null,
  p_offset    integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c       public.integration_clients;
  v_total integer;
  v_rows  jsonb;
begin
  c := public.integration_authenticate(p_key_hash);

  if p_operacion not in ('analytics_opportunities', 'analytics_indicators') then
    raise exception 'Operación inválida' using errcode = 'IN422';
  end if;
  if not c.can_read_analytics then
    raise exception 'La integración no tiene acceso de análisis' using errcode = 'IN403';
  end if;
  if (p_limit is not null and (p_limit < 1 or p_limit > 500)) or coalesce(p_offset, 0) < 0 then
    raise exception 'Paginación inválida' using errcode = 'IN422';
  end if;

  select count(*) into v_total
  from public.opportunities o
  where public.integration_analytics_match(o, p_filters);

  select coalesce(jsonb_agg(x.j order by x.updated_at desc, x.id), '[]'::jsonb) into v_rows
  from (
    select o.id, o.updated_at, jsonb_build_object(
      'id',                         o.id,
      'nombre',                     o.nombre,
      'business_unit',              o.business_unit,
      'etapa',                      o.etapa,
      'fuente',                     o.fuente,
      'moneda',                     o.moneda,
      'monto_estimado',             o.monto_estimado,
      'monto_estimado_mxn',         o.monto_estimado_mxn,
      'monto_final_mxn',            o.monto_final_mxn,
      'probabilidad',               o.probabilidad,
      'fecha_cierre_estimada',      o.fecha_cierre_estimada,
      'owner_id',                   o.owner_id,
      'created_at',                 o.created_at,
      'last_activity_at',           o.last_activity_at,
      'last_completed_activity_at', o.last_completed_activity_at,
      'next_activity_at',           o.next_activity_at,
      'closed_at',                  o.closed_at,
      'stale',                      o.stale,
      'notas',                      o.notas,
      'company', case when co.id is null then null else jsonb_build_object('nombre', co.nombre) end,
      'contact', case when ct.id is null then null else jsonb_build_object(
        'nombre',   ct.nombre,
        'apellido', ct.apellido,
        'puesto',   ct.puesto,
        'email',    case when c.can_read_contact_pii then ct.email    end,
        'telefono', case when c.can_read_contact_pii then ct.telefono end,
        'celular',  case when c.can_read_contact_pii then ct.celular  end
      ) end,
      'owner', jsonb_build_object('full_name', pr.full_name)
    ) as j
    from public.opportunities o
    left join public.companies co on co.id = o.company_id
    left join public.contacts  ct on ct.id = o.contact_id
    left join public.profiles  pr on pr.id = o.owner_id
    where public.integration_analytics_match(o, p_filters)
    order by o.updated_at desc, o.id
    limit p_limit offset coalesce(p_offset, 0)
  ) x;

  perform public.integration_log(c.id, p_operacion, null);
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

-- ── Grants ───────────────────────────────────────────────────────
-- Mismo criterio que 20261027120000: se revoca el EXECUTE por defecto y se concede explícito.
revoke all on function public.integration_set_permissions(uuid, boolean, boolean)                 from public, anon, authenticated, service_role;
revoke all on function public.integration_analytics_match(public.opportunities, jsonb)             from public, anon, authenticated, service_role;
revoke all on function public.integration_analytics_opportunities(text, text, jsonb, integer, integer) from public, anon, authenticated, service_role;

grant execute on function public.integration_set_permissions(uuid, boolean, boolean)                 to authenticated;
grant execute on function public.integration_analytics_opportunities(text, text, jsonb, integer, integer) to service_role;
