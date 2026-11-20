-- Migration: historial comercial de sólo lectura para integraciones (VÄLKEN) + keys sin escritura
-- Sprint: integración VÄLKEN
--
-- ADR-007, enmienda 2026-11-20. VÄLKEN prepara seguimientos con el historial real de cada
-- oportunidad: necesita leer actividades, empresas y contactos de TODAS las unidades sin poder
-- escribir nada.
--
-- - can_write = false: toda operación de escritura de la API responde 403, validado aquí.
--   Default true, así la integración actual (THÖREN) no cambia.
-- - can_read_history: habilita las lecturas integration_history_* (actividades con su
--   descripción, notas, empresas y contactos). Sólo surte efecto junto con can_read_analytics.
--   Email, teléfono y celular de contactos siguen detrás de can_read_contact_pii.
--
-- Ninguna función de lectura existente cambia. Las 6 de escritura se renombran a *_impl y se
-- envuelven con la verificación de can_write: mismo nombre, argumentos y resultado.

alter table public.integration_clients
  add column can_write        boolean not null default true,
  add column can_read_history boolean not null default false;

-- ── Switch desde la app ──────────────────────────────────────────
-- Reemplaza a integration_set_permissions() en /integraciones (la anterior se conserva para
-- no romper la app mientras se despliega). Datos de contacto e historial dependen del acceso
-- de análisis: apagarlo los apaga, y al volver a encenderlo no reaparecen solos.
create or replace function public.integration_set_read_permissions(
  p_client_id            uuid,
  p_can_read_analytics   boolean,
  p_can_read_contact_pii boolean,
  p_can_read_history     boolean
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
  set can_read_analytics     = coalesce(p_can_read_analytics, false),
      can_read_contact_pii   = coalesce(p_can_read_analytics and p_can_read_contact_pii, false),
      can_read_history       = coalesce(p_can_read_analytics and p_can_read_history, false),
      permissions_updated_by = auth.uid(),
      permissions_updated_at = now()
  where id = p_client_id;

  if not found then
    raise exception 'Integración no encontrada' using errcode = 'P0002';
  end if;
end;
$$;

-- ============================================================
-- Bloqueo de escritura (can_write = false)
-- ============================================================
-- Sólo decide sobre keys de sólo lectura. Una key inválida o revocada sigue su camino y
-- integration_authenticate() responde 401 como siempre. El intento bloqueado queda en la
-- bitácora (integration_log_failure desde la app) y cuenta para el rate limit.
create or replace function public.integration_require_write(p_key_hash text)
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if exists (
    select 1 from public.integration_clients
    where key_hash = p_key_hash and revoked_at is null and not can_write
  ) then
    raise exception 'Esta integración es de sólo lectura' using errcode = 'IN403';
  end if;
end;
$$;

alter function public.integration_create_company(text, jsonb)           rename to integration_create_company_impl;
alter function public.integration_create_contact(text, jsonb)           rename to integration_create_contact_impl;
alter function public.integration_create_opportunity(text, jsonb)       rename to integration_create_opportunity_impl;
alter function public.integration_update_opportunity(text, uuid, jsonb) rename to integration_update_opportunity_impl;
alter function public.integration_create_activity(text, jsonb)          rename to integration_create_activity_impl;
alter function public.integration_update_activity(text, uuid, jsonb)    rename to integration_update_activity_impl;

create function public.integration_create_company(p_key_hash text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.integration_require_write(p_key_hash);
  return public.integration_create_company_impl(p_key_hash, p_data);
end;
$$;

create function public.integration_create_contact(p_key_hash text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.integration_require_write(p_key_hash);
  return public.integration_create_contact_impl(p_key_hash, p_data);
end;
$$;

create function public.integration_create_opportunity(p_key_hash text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.integration_require_write(p_key_hash);
  return public.integration_create_opportunity_impl(p_key_hash, p_data);
end;
$$;

create function public.integration_update_opportunity(p_key_hash text, p_opp_id uuid, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.integration_require_write(p_key_hash);
  return public.integration_update_opportunity_impl(p_key_hash, p_opp_id, p_data);
end;
$$;

create function public.integration_create_activity(p_key_hash text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.integration_require_write(p_key_hash);
  return public.integration_create_activity_impl(p_key_hash, p_data);
end;
$$;

create function public.integration_update_activity(p_key_hash text, p_activity_id uuid, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.integration_require_write(p_key_hash);
  return public.integration_update_activity_impl(p_key_hash, p_activity_id, p_data);
end;
$$;

-- ============================================================
-- Helpers del historial (no expuestos: ver grants al final)
-- ============================================================
create or replace function public.integration_history_client(p_key_hash text)
returns public.integration_clients
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.integration_clients;
begin
  c := public.integration_authenticate(p_key_hash);
  if not (c.can_read_analytics and c.can_read_history) then
    raise exception 'La integración no tiene acceso al historial comercial' using errcode = 'IN403';
  end if;
  return c;
end;
$$;

create or replace function public.integration_history_check_page(p_limit integer, p_offset integer)
returns void
language plpgsql
immutable
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 500 or p_offset is null or p_offset < 0 then
    raise exception 'Paginación inválida' using errcode = 'IN422';
  end if;
end;
$$;

-- Lista explícita de columnas: una columna nueva en la tabla no se expone sola. El teléfono
-- de la empresa también es dato de contacto: sigue el mismo switch que el de las personas.
create or replace function public.integration_history_company_json(co public.companies, p_pii boolean)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id',         co.id,
    'nombre',     co.nombre,
    'rfc',        co.rfc,
    'industria',  co.industria,
    'sitio_web',  co.sitio_web,
    'telefono',   case when p_pii then co.telefono end,
    'ciudad',     co.ciudad,
    'estado',     co.estado,
    'notas',      co.notas,
    'created_at', co.created_at,
    'updated_at', co.updated_at
  );
$$;

create or replace function public.integration_history_contact_json(ct public.contacts, p_pii boolean)
returns jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id',         ct.id,
    'company_id', ct.company_id,
    'nombre',     ct.nombre,
    'apellido',   ct.apellido,
    'puesto',     ct.puesto,
    'email',      case when p_pii then ct.email    end,
    'telefono',   case when p_pii then ct.telefono end,
    'celular',    case when p_pii then ct.celular  end,
    'notas',      ct.notas,
    'created_at', ct.created_at,
    'updated_at', ct.updated_at
  );
$$;

create or replace function public.integration_history_activity_json(a public.activities)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',                     a.id,
    'tipo',                   a.tipo,
    'estatus',                a.estatus,
    'titulo',                 a.titulo,
    'descripcion',            a.descripcion,
    'fecha',                  a.fecha,
    'completed_at',           a.completed_at,
    'created_at',             a.created_at,
    'vendedor', jsonb_build_object(
      'id',     a.owner_id,
      'nombre', (select full_name from public.profiles where id = a.owner_id)
    ),
    'creada_por_integracion', a.integration_client_id is not null
  );
$$;

-- Referencia corta a una oportunidad (detalle de empresa/contacto)
create or replace function public.integration_history_opportunity_refs(p_company_id uuid, p_contact_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',            o.id,
    'nombre',        o.nombre,
    'business_unit', o.business_unit,
    'etapa',         o.etapa,
    'updated_at',    o.updated_at
  ) order by o.updated_at desc, o.id), '[]'::jsonb)
  from public.opportunities o
  where (p_company_id is not null and o.company_id = p_company_id)
     or (p_contact_id is not null and o.contact_id = p_contact_id);
$$;

-- Filtros de actividades (llaves ausentes = sin filtro). date_field elige qué fecha filtra
-- el rango: fecha (programada), completed_at o created_at (registro).
create or replace function public.integration_history_activity_match(
  a public.activities, o public.opportunities, p jsonb
)
returns boolean
language sql
stable
set search_path = public
as $$
  select (p->>'opportunity_id' is null or a.opportunity_id  = (p->>'opportunity_id')::uuid)
     and (p->>'company_id'     is null or o.company_id      = (p->>'company_id')::uuid)
     and (p->>'contact_id'     is null or o.contact_id      = (p->>'contact_id')::uuid)
     and (p->>'business_unit'  is null or o.business_unit   = (p->>'business_unit')::public.business_unit)
     and (p->>'tipo'           is null or a.tipo            = (p->>'tipo')::public.activity_type)
     and (p->>'estatus'        is null or a.estatus         = (p->>'estatus')::public.activity_status)
     and (p->>'date_from'      is null or (case p->>'date_field'
                                             when 'completed_at' then a.completed_at
                                             when 'created_at'   then a.created_at
                                             else a.fecha end) >= (p->>'date_from')::timestamptz)
     and (p->>'date_before'    is null or (case p->>'date_field'
                                             when 'completed_at' then a.completed_at
                                             when 'created_at'   then a.created_at
                                             else a.fecha end) <  (p->>'date_before')::timestamptz);
$$;

-- ============================================================
-- Operaciones expuestas a /api/integrations/v1/analytics/* (service_role)
-- Todas: sólo lectura, cualquier unidad, una fila en la bitácora por llamada.
-- ============================================================

-- Oportunidad con todas sus actividades. Mismas llaves que integration_analytics_opportunities
-- (la app las mapea igual) más company_id, contact_id y actividades.
create or replace function public.integration_history_opportunity(p_key_hash text, p_opp_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c      public.integration_clients;
  v_json jsonb;
begin
  c := public.integration_history_client(p_key_hash);

  select jsonb_build_object(
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
    'company_id',                 o.company_id,
    'contact_id',                 o.contact_id,
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
    'closer', case when cl.id is null then null else jsonb_build_object('full_name', cl.full_name) end,
    'actividades', coalesce((
      select jsonb_agg(public.integration_history_activity_json(a) order by a.fecha, a.id)
      from public.activities a where a.opportunity_id = o.id
    ), '[]'::jsonb)
  ) into v_json
  from public.opportunities o
  left join public.companies co on co.id = o.company_id
  left join public.contacts  ct on ct.id = o.contact_id
  left join public.profiles  pr on pr.id = o.owner_id
  left join public.profiles  cl on cl.id = o.closed_by
  where o.id = p_opp_id;

  if v_json is null then
    raise exception 'Oportunidad no encontrada' using errcode = 'IN404';
  end if;

  perform public.integration_log(c.id, 'history_opportunity', p_opp_id);
  return v_json;
end;
$$;

create or replace function public.integration_history_activities(
  p_key_hash text,
  p_filters  jsonb   default '{}'::jsonb,
  p_limit    integer default 100,
  p_offset   integer default 0
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
  c := public.integration_history_client(p_key_hash);
  perform public.integration_history_check_page(p_limit, p_offset);

  select count(*) into v_total
  from public.activities a
  join public.opportunities o on o.id = a.opportunity_id
  where public.integration_history_activity_match(a, o, p_filters);

  select coalesce(jsonb_agg(x.j order by x.fecha desc, x.id), '[]'::jsonb) into v_rows
  from (
    select a.id, a.fecha,
           public.integration_history_activity_json(a) || jsonb_build_object(
             'opportunity_id', o.id,
             'oportunidad',    o.nombre,
             'business_unit',  o.business_unit,
             'etapa',          o.etapa,
             'company_id',     o.company_id,
             'contact_id',     o.contact_id
           ) as j
    from public.activities a
    join public.opportunities o on o.id = a.opportunity_id
    where public.integration_history_activity_match(a, o, p_filters)
    order by a.fecha desc, a.id
    limit p_limit offset p_offset
  ) x;

  perform public.integration_log(c.id, 'history_activities', (p_filters->>'opportunity_id')::uuid);
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

-- q busca dentro del nombre (sin distinguir mayúsculas) o al inicio del RFC
create or replace function public.integration_history_companies(
  p_key_hash text,
  p_q        text    default null,
  p_limit    integer default 100,
  p_offset   integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c       public.integration_clients;
  v_q     text := nullif(trim(coalesce(p_q, '')), '');
  v_total integer;
  v_rows  jsonb;
begin
  c := public.integration_history_client(p_key_hash);
  perform public.integration_history_check_page(p_limit, p_offset);

  select count(*) into v_total
  from public.companies co
  where v_q is null
     or strpos(lower(co.nombre), lower(v_q)) > 0
     or strpos(coalesce(public.integration_normalize_rfc(co.rfc), ''), public.integration_normalize_rfc(v_q)) = 1;

  select coalesce(jsonb_agg(public.integration_history_company_json(x, c.can_read_contact_pii)
                            order by x.nombre, x.id), '[]'::jsonb)
  into v_rows
  from (
    select co.*
    from public.companies co
    where v_q is null
       or strpos(lower(co.nombre), lower(v_q)) > 0
       or strpos(coalesce(public.integration_normalize_rfc(co.rfc), ''), public.integration_normalize_rfc(v_q)) = 1
    order by co.nombre, co.id
    limit p_limit offset p_offset
  ) x;

  perform public.integration_log(c.id, 'history_companies', null);
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

create or replace function public.integration_history_company(p_key_hash text, p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c      public.integration_clients;
  v_json jsonb;
begin
  c := public.integration_history_client(p_key_hash);

  select public.integration_history_company_json(co, c.can_read_contact_pii) || jsonb_build_object(
    'contactos', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ct.id, 'nombre', ct.nombre, 'apellido', ct.apellido, 'puesto', ct.puesto
      ) order by ct.nombre, ct.id)
      from public.contacts ct where ct.company_id = co.id
    ), '[]'::jsonb),
    'oportunidades', public.integration_history_opportunity_refs(co.id, null)
  ) into v_json
  from public.companies co
  where co.id = p_company_id;

  if v_json is null then
    raise exception 'Empresa no encontrada' using errcode = 'IN404';
  end if;

  perform public.integration_log(c.id, 'history_company', p_company_id);
  return v_json;
end;
$$;

-- q busca dentro de "nombre apellido" (sin distinguir mayúsculas). No busca por email ni
-- teléfono: eso revelaría datos de contacto a una integración sin can_read_contact_pii.
create or replace function public.integration_history_contacts(
  p_key_hash   text,
  p_company_id uuid    default null,
  p_q          text    default null,
  p_limit      integer default 100,
  p_offset     integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c       public.integration_clients;
  v_q     text := nullif(trim(coalesce(p_q, '')), '');
  v_total integer;
  v_rows  jsonb;
begin
  c := public.integration_history_client(p_key_hash);
  perform public.integration_history_check_page(p_limit, p_offset);

  select count(*) into v_total
  from public.contacts ct
  where (p_company_id is null or ct.company_id = p_company_id)
    and (v_q is null or strpos(lower(concat_ws(' ', ct.nombre, ct.apellido)), lower(v_q)) > 0);

  select coalesce(jsonb_agg(public.integration_history_contact_json(x, c.can_read_contact_pii)
                            order by x.nombre, x.id), '[]'::jsonb)
  into v_rows
  from (
    select ct.*
    from public.contacts ct
    where (p_company_id is null or ct.company_id = p_company_id)
      and (v_q is null or strpos(lower(concat_ws(' ', ct.nombre, ct.apellido)), lower(v_q)) > 0)
    order by ct.nombre, ct.id
    limit p_limit offset p_offset
  ) x;

  perform public.integration_log(c.id, 'history_contacts', p_company_id);
  return jsonb_build_object('total', v_total, 'rows', v_rows);
end;
$$;

create or replace function public.integration_history_contact(p_key_hash text, p_contact_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c      public.integration_clients;
  v_json jsonb;
begin
  c := public.integration_history_client(p_key_hash);

  select public.integration_history_contact_json(ct, c.can_read_contact_pii) || jsonb_build_object(
    'oportunidades', public.integration_history_opportunity_refs(null, ct.id)
  ) into v_json
  from public.contacts ct
  where ct.id = p_contact_id;

  if v_json is null then
    raise exception 'Contacto no encontrado' using errcode = 'IN404';
  end if;

  perform public.integration_log(c.id, 'history_contact', p_contact_id);
  return v_json;
end;
$$;

-- ============================================================
-- Grants. Mismo criterio que 20261027120000: se revoca el EXECUTE por defecto y se concede
-- explícito. Las *_impl dejan de ser invocables desde la API: sólo a través de su envoltura.
-- ============================================================
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'integration\_history\_%'
        or p.proname like 'integration\_%\_impl'
        or p.proname in (
          'integration_require_write', 'integration_set_read_permissions',
          'integration_create_company', 'integration_create_contact', 'integration_create_opportunity',
          'integration_update_opportunity', 'integration_create_activity', 'integration_update_activity'
        ))
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', fn);
  end loop;
end;
$$;

grant execute on function public.integration_set_read_permissions(uuid, boolean, boolean, boolean) to authenticated;

grant execute on function public.integration_create_company(text, jsonb)           to service_role;
grant execute on function public.integration_create_contact(text, jsonb)           to service_role;
grant execute on function public.integration_create_opportunity(text, jsonb)       to service_role;
grant execute on function public.integration_update_opportunity(text, uuid, jsonb) to service_role;
grant execute on function public.integration_create_activity(text, jsonb)          to service_role;
grant execute on function public.integration_update_activity(text, uuid, jsonb)    to service_role;

grant execute on function public.integration_history_opportunity(text, uuid)                       to service_role;
grant execute on function public.integration_history_activities(text, jsonb, integer, integer)     to service_role;
grant execute on function public.integration_history_companies(text, text, integer, integer)       to service_role;
grant execute on function public.integration_history_company(text, uuid)                           to service_role;
grant execute on function public.integration_history_contacts(text, uuid, text, integer, integer)  to service_role;
grant execute on function public.integration_history_contact(text, uuid)                           to service_role;
