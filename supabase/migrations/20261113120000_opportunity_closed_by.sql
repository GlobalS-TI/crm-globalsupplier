-- Migration: closed_by y seller_id en opportunities
-- Sprint: Reportes comerciales — atribución de ventas al vendedor que cerró
--
-- 1. closed_by: el vendedor responsable (owner_id) en el momento en que la oportunidad
--    pasó a una etapa cerrada. Hasta ahora los reportes agrupaban por el owner_id ACTUAL,
--    así que reasignar una oportunidad ya cerrada le movía la venta a otro vendedor.
--    Se congela el owner y no auth.uid(): RLS sólo deja a un vendedor cerrar sus propias
--    oportunidades, así que para vendedores es lo mismo, y si dirección marca "ganado" a
--    nombre de un vendedor la venta sigue siendo del vendedor. Lo mantiene el mismo
--    trigger que closed_at (criterio ADR-002): la app no lo escribe.
--
-- 2. seller_id: a quién se le acredita la oportunidad — closed_by si está cerrada, si no
--    el owner actual. Columna generada para que /reportes y THÖREN filtren por vendedor
--    con una sola condición.

alter table public.opportunities
  add column closed_by uuid references public.profiles(id);

comment on column public.opportunities.closed_by is
  'Vendedor (owner_id) al momento de cerrar. Lo mantiene trg_opp_sync_closed_at; null si está abierta.';

-- ── Backfill ─────────────────────────────────────────────────────
-- No hay historial de reasignaciones: el owner actual es la mejor aproximación. Va antes de
-- reemplazar la función del trigger (la versión actual no toca closed_by) y sin
-- trg_opps_updated para no mover updated_at.

alter table public.opportunities disable trigger trg_opps_updated;

update public.opportunities
set closed_by = owner_id
where etapa in ('ganado', 'perdido', 'sin_respuesta');

alter table public.opportunities enable trigger trg_opps_updated;

-- Se calcula después de los triggers BEFORE, así que ve el closed_by que puso el trigger.
alter table public.opportunities
  add column seller_id uuid generated always as (coalesce(closed_by, owner_id)) stored;

create index idx_opp_seller_id on public.opportunities (seller_id);

-- ── closed_at + closed_by ────────────────────────────────────────

create or replace function public.sync_opportunity_closed_at()
returns trigger
language plpgsql
as $$
begin
  if new.etapa not in ('ganado', 'perdido', 'sin_respuesta') then
    new.closed_at := null;
    new.closed_by := null;
  elsif tg_op = 'INSERT' or new.etapa is distinct from old.etapa then
    new.closed_at := now();
    new.closed_by := new.owner_id;
  else
    -- Misma etapa cerrada: se conservan fecha y vendedor originales aunque alguien
    -- reasigne la oportunidad o intente escribir closed_at/closed_by directo.
    new.closed_at := old.closed_at;
    new.closed_by := old.closed_by;
  end if;
  return new;
end;
$$;

-- ── THÖREN: mismos filtros y atribución que /reportes ────────────
-- Cuerpo de 20261103120000 más:
--   seller_id     vendedor acreditado (closed_by o, si está abierta, owner_id)
--   include_open  con rango de cierre, las abiertas entran sin importar closed_at

create or replace function public.integration_analytics_match(o public.opportunities, p jsonb)
returns boolean
language sql
stable
set search_path = public
as $$
  select (p->>'owner_id'       is null or o.owner_id      = (p->>'owner_id')::uuid)
     and (p->>'seller_id'      is null or o.seller_id     = (p->>'seller_id')::uuid)
     and (p->>'business_unit'  is null or o.business_unit = (p->>'business_unit')::public.business_unit)
     and (p->'stages'          is null or o.etapa::text in (select jsonb_array_elements_text(p->'stages')))
     and (p->>'created_from'   is null or o.created_at   >= (p->>'created_from')::timestamptz)
     and (p->>'created_before' is null or o.created_at   <  (p->>'created_before')::timestamptz)
     and ((coalesce((p->>'include_open')::boolean, false) and o.closed_at is null)
          or (    (p->>'closed_from'   is null or o.closed_at >= (p->>'closed_from')::timestamptz)
              and (p->>'closed_before' is null or o.closed_at <  (p->>'closed_before')::timestamptz)))
     and (coalesce((p->>'next_activity_missing')::boolean, false) = false or o.next_activity_at is null)
     and (p->>'next_activity_before' is null or o.next_activity_at < (p->>'next_activity_before')::timestamptz)
     and (p->>'stale'          is null or o.stale        = (p->>'stale')::boolean);
$$;

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
      'closed_by',                  o.closed_by,
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
      'owner',  jsonb_build_object('full_name', pr.full_name),
      'closer', case when cl.id is null then null else jsonb_build_object('full_name', cl.full_name) end
    ) as j
    from public.opportunities o
    left join public.companies co on co.id = o.company_id
    left join public.contacts  ct on ct.id = o.contact_id
    left join public.profiles  pr on pr.id = o.owner_id
    left join public.profiles  cl on cl.id = o.closed_by
    where public.integration_analytics_match(o, p_filters)
    order by o.updated_at desc, o.id
    limit p_limit offset coalesce(p_offset, 0)
  ) x;

  perform public.integration_log(c.id, p_operacion, null);
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;
