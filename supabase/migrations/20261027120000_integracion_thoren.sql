-- Migration: API de integración externa — THÖREN AI para Juno Promotional (piloto)
-- Sprint: integración THÖREN
--
-- ADR-007. Un cliente de integración es un sistema externo (no una persona, no tiene
-- login). Opera sólo a través de las funciones integration_* de abajo, que reciben el
-- hash SHA-256 de su API key y aplican TODAS las reglas de alcance en la DB (ADR-003):
--   * unidad de negocio y dueño fijos por cliente (no los elige quien llama)
--   * sólo edita oportunidades/actividades que él mismo creó
--   * etapas ganado / perdido / sin_respuesta reservadas para personas
--   * búsqueda de empresas/contactos sólo por RFC, email o teléfono exactos, con datos
--     mínimos; detalle completo sólo de registros autorizados (ver integration_can_read_*)
--   * no existe ninguna función de borrado
-- Las políticas RLS existentes NO se modifican. Las funciones de operación sólo las
-- ejecuta service_role desde /api/integrations/v1/*; emitir/revocar keys sólo desde el
-- SQL editor (postgres).

create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- integration_clients
-- ============================================================
create table public.integration_clients (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null unique,
  -- Marca visible en notas de las oportunidades que crea, p. ej. [THOREN_AI]
  etiqueta             text not null check (etiqueta ~ '^[A-Z0-9_]{2,32}$'),
  business_unit        public.business_unit not null,
  -- Dueño (owner_id) de todo lo que crea la integración
  owner_id             uuid not null references public.profiles(id),
  key_hash             text unique,   -- sha256 hex de la API key; null = sin key emitida
  key_prefix           text,          -- primeros caracteres, para identificarla sin exponerla
  key_issued_at        timestamptz,
  revoked_at           timestamptz,
  max_calls_per_minute integer not null default 20  check (max_calls_per_minute > 0),
  max_calls_per_day    integer not null default 300 check (max_calls_per_day > 0),
  last_used_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger trg_integration_clients_updated
  before update on public.integration_clients
  for each row execute function public.set_updated_at();

-- Sólo lectura (auditoría) para director_general y administracion. Sin políticas de
-- escritura: altas, emisión y revocación de keys se hacen desde el SQL editor.
alter table public.integration_clients enable row level security;

create policy integration_clients_select on public.integration_clients
  for select to authenticated
  using (public.is_director_general() or public.is_admin());

grant select, insert, update, delete on public.integration_clients to authenticated, service_role;

-- ============================================================
-- integration_audit_log — una fila por llamada; también alimenta el rate limit
-- ============================================================
create table public.integration_audit_log (
  id         bigint generated always as identity primary key,
  client_id  uuid not null references public.integration_clients(id) on delete cascade,
  operacion  text not null,
  target_id  uuid,
  ok         boolean not null,
  error      text,
  created_at timestamptz not null default now()
);

create index idx_integration_audit_client_time
  on public.integration_audit_log (client_id, created_at desc);

alter table public.integration_audit_log enable row level security;

create policy integration_audit_log_select on public.integration_audit_log
  for select to authenticated
  using (public.is_director_general() or public.is_admin());

grant select, insert, update, delete on public.integration_audit_log to authenticated, service_role;

-- ============================================================
-- Procedencia: qué registros creó cada integración. Nullable — las filas creadas
-- desde la app quedan en null y su comportamiento no cambia.
-- ============================================================
alter table public.companies     add column integration_client_id uuid references public.integration_clients(id);
alter table public.contacts      add column integration_client_id uuid references public.integration_clients(id);
alter table public.opportunities add column integration_client_id uuid references public.integration_clients(id);
alter table public.activities    add column integration_client_id uuid references public.integration_clients(id);

create index idx_companies_integration     on public.companies     (integration_client_id) where integration_client_id is not null;
create index idx_contacts_integration      on public.contacts      (integration_client_id) where integration_client_id is not null;
create index idx_opp_integration           on public.opportunities (integration_client_id) where integration_client_id is not null;
create index idx_activities_integration    on public.activities    (integration_client_id) where integration_client_id is not null;

-- Un usuario de la app (auth.uid() no nulo) no puede marcar ni desmarcar registros como
-- de una integración: marcar uno ampliaría lo que la integración puede editar. Las
-- funciones integration_* corren con service_role, donde auth.uid() es null.
create or replace function public.guard_integration_client_id()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' and new.integration_client_id is not null then
      raise exception 'integration_client_id sólo lo asigna la API de integración';
    end if;
    if tg_op = 'UPDATE' and new.integration_client_id is distinct from old.integration_client_id then
      raise exception 'integration_client_id no se puede modificar';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_companies_guard_integration
  before insert or update on public.companies
  for each row execute function public.guard_integration_client_id();
create trigger trg_contacts_guard_integration
  before insert or update on public.contacts
  for each row execute function public.guard_integration_client_id();
create trigger trg_opps_guard_integration
  before insert or update on public.opportunities
  for each row execute function public.guard_integration_client_id();
create trigger trg_activities_guard_integration
  before insert or update on public.activities
  for each row execute function public.guard_integration_client_id();

-- ============================================================
-- Helpers internos (no expuestos: ver grants al final)
-- Códigos de error propios → HTTP en lib/repositories/supabase/IntegrationRepository.ts:
--   IN401 key inválida/revocada · IN403 fuera de alcance · IN404 no existe o no autorizado
--   IN409 duplicado · IN422 datos inválidos · IN429 rate limit
-- ============================================================
create or replace function public.integration_normalize_phone(p text)
returns text
language sql
immutable
as $$
  select nullif(right(regexp_replace(coalesce(p, ''), '\D', '', 'g'), 10), '');
$$;

create or replace function public.integration_normalize_rfc(p text)
returns text
language sql
immutable
as $$
  select nullif(upper(regexp_replace(coalesce(p, ''), '\s', '', 'g')), '');
$$;

create or replace function public.integration_normalize_email(p text)
returns text
language sql
immutable
as $$
  select nullif(lower(trim(coalesce(p, ''))), '');
$$;

create or replace function public.integration_stage_allowed(p_etapa public.opportunity_stage)
returns boolean
language sql
immutable
as $$
  select p_etapa in (
    'nuevo_lead', 'contactado', 'diagnostico', 'cotizacion_enviada', 'seguimiento', 'negociacion'
  );
$$;

create or replace function public.integration_authenticate(p_key_hash text)
returns public.integration_clients
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.integration_clients;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'API key inválida' using errcode = 'IN401';
  end if;

  -- for update serializa las llamadas concurrentes del mismo cliente para que el
  -- conteo del rate limit no se pueda rebasar en paralelo.
  select * into c
  from public.integration_clients
  where key_hash = p_key_hash and revoked_at is null
  for update;

  if not found then
    raise exception 'API key inválida o revocada' using errcode = 'IN401';
  end if;

  if not exists (select 1 from public.profiles where id = c.owner_id and is_active) then
    raise exception 'El usuario dueño de la integración está desactivado' using errcode = 'IN403';
  end if;

  if (select count(*) from public.integration_audit_log
      where client_id = c.id and created_at > now() - interval '1 minute') >= c.max_calls_per_minute
  or (select count(*) from public.integration_audit_log
      where client_id = c.id and created_at > now() - interval '1 day') >= c.max_calls_per_day
  then
    raise exception 'Límite de llamadas excedido' using errcode = 'IN429';
  end if;

  update public.integration_clients set last_used_at = now() where id = c.id;
  return c;
end;
$$;

create or replace function public.integration_log(
  p_client_id uuid, p_operacion text, p_target_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.integration_audit_log (client_id, operacion, target_id, ok)
  values (p_client_id, p_operacion, p_target_id, true);
$$;

-- Detalle completo autorizado: lo creó esta integración, o está ligado a una oportunidad
-- de su unidad que creó una PERSONA (integration_client_id is null). La segunda condición
-- impide que la integración se autorice sola ligando una empresa ajena a una opp propia.
create or replace function public.integration_can_read_company(
  p_client_id uuid, p_unit public.business_unit, p_company_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.companies
    where id = p_company_id and integration_client_id = p_client_id
  ) or exists (
    select 1 from public.opportunities
    where company_id = p_company_id and business_unit = p_unit and integration_client_id is null
  );
$$;

create or replace function public.integration_can_read_contact(
  p_client_id uuid, p_unit public.business_unit, p_contact_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.contacts
    where id = p_contact_id and integration_client_id = p_client_id
  ) or exists (
    select 1 from public.opportunities
    where contact_id = p_contact_id and business_unit = p_unit and integration_client_id is null
  );
$$;

create or replace function public.integration_mark_notes(p_etiqueta text, p_notas text)
returns text
language sql
immutable
as $$
  select case
    when coalesce(p_notas, '') like '[' || p_etiqueta || ']%' then p_notas
    else trim('[' || p_etiqueta || '] ' || coalesce(p_notas, ''))
  end;
$$;

create or replace function public.integration_opportunity_json(p_opp_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',                    o.id,
    'nombre',                o.nombre,
    'business_unit',         o.business_unit,
    'etapa',                 o.etapa,
    'fuente',                o.fuente,
    'moneda',                o.moneda,
    'monto_estimado',        o.monto_estimado,
    'tipo_cambio_estimado',  o.tipo_cambio_estimado,
    'monto_final',           o.monto_final,
    'probabilidad',          o.probabilidad,
    'fecha_cierre_estimada', o.fecha_cierre_estimada,
    'next_activity_at',      o.next_activity_at,
    'last_activity_at',      o.last_activity_at,
    'stale',                 o.stale,
    'notas',                 o.notas,
    'company_id',            o.company_id,
    'contact_id',            o.contact_id,
    'editable',              public.integration_stage_allowed(o.etapa),
    'created_at',            o.created_at,
    'updated_at',            o.updated_at,
    'actividades', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',                     a.id,
        'tipo',                   a.tipo,
        'estatus',                a.estatus,
        'titulo',                 a.titulo,
        'descripcion',            a.descripcion,
        'fecha',                  a.fecha,
        'completed_at',           a.completed_at,
        'creada_por_integracion', a.integration_client_id is not null
      ) order by a.fecha)
      from public.activities a where a.opportunity_id = o.id
    ), '[]'::jsonb)
  )
  from public.opportunities o
  where o.id = p_opp_id;
$$;

-- ============================================================
-- Operaciones expuestas a /api/integrations/v1/* (service_role)
-- ============================================================

-- Búsqueda anti-duplicados: coincidencia exacta normalizada, máx. 10 por tipo, datos
-- mínimos. company_id sólo se revela si el contacto está autorizado.
create or replace function public.integration_lookup(
  p_key_hash text,
  p_rfc      text default null,
  p_email    text default null,
  p_telefono text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c         public.integration_clients;
  v_rfc     text := public.integration_normalize_rfc(p_rfc);
  v_email   text := public.integration_normalize_email(p_email);
  v_tel     text := public.integration_normalize_phone(p_telefono);
  v_empresas  jsonb;
  v_contactos jsonb;
begin
  c := public.integration_authenticate(p_key_hash);

  if v_rfc is null and v_email is null and v_tel is null then
    raise exception 'Se requiere rfc, email o telefono' using errcode = 'IN422';
  end if;
  if v_rfc is not null and length(v_rfc) not between 12 and 13 then
    raise exception 'RFC inválido' using errcode = 'IN422';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+$' then
    raise exception 'Email inválido' using errcode = 'IN422';
  end if;
  if v_tel is not null and length(v_tel) < 10 then
    raise exception 'Teléfono inválido: se requieren al menos 10 dígitos' using errcode = 'IN422';
  end if;

  select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) into v_empresas
  from (
    select co.id,
           co.nombre,
           case when v_rfc is not null and public.integration_normalize_rfc(co.rfc) = v_rfc
                then 'rfc' else 'telefono' end as coincidencia,
           public.integration_can_read_company(c.id, c.business_unit, co.id) as autorizado
    from public.companies co
    where (v_rfc is not null and public.integration_normalize_rfc(co.rfc) = v_rfc)
       or (v_tel is not null and public.integration_normalize_phone(co.telefono) = v_tel)
    order by co.created_at
    limit 10
  ) m;

  select coalesce(jsonb_agg(to_jsonb(m)), '[]'::jsonb) into v_contactos
  from (
    select x.id, x.nombre, x.apellido, x.coincidencia, x.autorizado,
           case when x.autorizado then x.company_id end as company_id
    from (
      select ct.id, ct.nombre, ct.apellido, ct.company_id,
             case when v_email is not null and public.integration_normalize_email(ct.email) = v_email
                  then 'email' else 'telefono' end as coincidencia,
             public.integration_can_read_contact(c.id, c.business_unit, ct.id) as autorizado
      from public.contacts ct
      where (v_email is not null and public.integration_normalize_email(ct.email) = v_email)
         or (v_tel is not null and (public.integration_normalize_phone(ct.telefono) = v_tel
                                 or public.integration_normalize_phone(ct.celular) = v_tel))
      order by ct.created_at
      limit 10
    ) x
  ) m;

  perform public.integration_log(c.id, 'lookup', null);
  return jsonb_build_object('empresas', v_empresas, 'contactos', v_contactos);
end;
$$;

create or replace function public.integration_get_company(p_key_hash text, p_company_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c      public.integration_clients;
  v_json jsonb;
begin
  c := public.integration_authenticate(p_key_hash);

  if not public.integration_can_read_company(c.id, c.business_unit, p_company_id) then
    raise exception 'Empresa no encontrada' using errcode = 'IN404';
  end if;

  select to_jsonb(co) - 'owner_id' - 'integration_client_id' into v_json
  from public.companies co where co.id = p_company_id;

  perform public.integration_log(c.id, 'get_company', p_company_id);
  return v_json;
end;
$$;

create or replace function public.integration_get_contact(p_key_hash text, p_contact_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c      public.integration_clients;
  v_json jsonb;
begin
  c := public.integration_authenticate(p_key_hash);

  if not public.integration_can_read_contact(c.id, c.business_unit, p_contact_id) then
    raise exception 'Contacto no encontrado' using errcode = 'IN404';
  end if;

  select to_jsonb(ct) - 'owner_id' - 'integration_client_id' into v_json
  from public.contacts ct where ct.id = p_contact_id;

  perform public.integration_log(c.id, 'get_contact', p_contact_id);
  return v_json;
end;
$$;

create or replace function public.integration_create_company(p_key_hash text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c          public.integration_clients;
  v_rfc      text := public.integration_normalize_rfc(p_data->>'rfc');
  v_existing uuid;
  v_id       uuid;
begin
  c := public.integration_authenticate(p_key_hash);

  if nullif(trim(coalesce(p_data->>'nombre', '')), '') is null then
    raise exception 'nombre es requerido' using errcode = 'IN422';
  end if;

  if v_rfc is not null then
    select id into v_existing from public.companies
    where public.integration_normalize_rfc(rfc) = v_rfc limit 1;
    if found then
      raise exception 'Ya existe una empresa con ese RFC'
        using errcode = 'IN409', detail = v_existing::text;
    end if;
  end if;

  insert into public.companies (
    nombre, rfc, industria, sitio_web, telefono, ciudad, estado, notas,
    owner_id, integration_client_id
  ) values (
    trim(p_data->>'nombre'), v_rfc, p_data->>'industria', nullif(p_data->>'sitio_web', ''),
    p_data->>'telefono', p_data->>'ciudad', p_data->>'estado', p_data->>'notas',
    c.owner_id, c.id
  )
  returning id into v_id;

  perform public.integration_log(c.id, 'create_company', v_id);
  return (select to_jsonb(co) - 'owner_id' - 'integration_client_id'
          from public.companies co where co.id = v_id);
end;
$$;

create or replace function public.integration_create_contact(p_key_hash text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c          public.integration_clients;
  v_email    text := public.integration_normalize_email(p_data->>'email');
  v_company  uuid := (p_data->>'company_id')::uuid;
  v_existing uuid;
  v_id       uuid;
begin
  c := public.integration_authenticate(p_key_hash);

  if nullif(trim(coalesce(p_data->>'nombre', '')), '') is null then
    raise exception 'nombre es requerido' using errcode = 'IN422';
  end if;

  if v_company is not null and not exists (select 1 from public.companies where id = v_company) then
    raise exception 'company_id no existe' using errcode = 'IN422';
  end if;

  if v_email is not null then
    select id into v_existing from public.contacts
    where public.integration_normalize_email(email) = v_email limit 1;
    if found then
      raise exception 'Ya existe un contacto con ese email'
        using errcode = 'IN409', detail = v_existing::text;
    end if;
  end if;

  insert into public.contacts (
    company_id, nombre, apellido, puesto, email, telefono, celular, notas,
    owner_id, integration_client_id
  ) values (
    v_company, trim(p_data->>'nombre'), p_data->>'apellido', p_data->>'puesto', v_email,
    p_data->>'telefono', p_data->>'celular', p_data->>'notas',
    c.owner_id, c.id
  )
  returning id into v_id;

  perform public.integration_log(c.id, 'create_contact', v_id);
  return (select to_jsonb(ct) - 'owner_id' - 'integration_client_id'
          from public.contacts ct where ct.id = v_id);
end;
$$;

create or replace function public.integration_create_opportunity(p_key_hash text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c         public.integration_clients;
  v_etapa   public.opportunity_stage := coalesce(p_data->>'etapa', 'nuevo_lead')::public.opportunity_stage;
  v_moneda  public.currency := coalesce(p_data->>'moneda', 'MXN')::public.currency;
  v_company uuid := (p_data->>'company_id')::uuid;
  v_contact uuid := (p_data->>'contact_id')::uuid;
  v_id      uuid;
begin
  c := public.integration_authenticate(p_key_hash);

  if not public.integration_stage_allowed(v_etapa) then
    raise exception 'La etapa % está reservada para intervención humana', v_etapa using errcode = 'IN403';
  end if;
  if nullif(trim(coalesce(p_data->>'nombre', '')), '') is null then
    raise exception 'nombre es requerido' using errcode = 'IN422';
  end if;
  -- Regla 3 (lib/CLAUDE.md): etapas abiertas requieren next_activity_at
  if p_data->>'next_activity_at' is null then
    raise exception 'next_activity_at es requerido' using errcode = 'IN422';
  end if;
  if v_company is not null and not exists (select 1 from public.companies where id = v_company) then
    raise exception 'company_id no existe' using errcode = 'IN422';
  end if;
  if v_contact is not null and not exists (select 1 from public.contacts where id = v_contact) then
    raise exception 'contact_id no existe' using errcode = 'IN422';
  end if;

  insert into public.opportunities (
    nombre, business_unit, fuente, owner_id, company_id, contact_id, etapa,
    moneda, monto_estimado, tipo_cambio_estimado, probabilidad,
    fecha_cierre_estimada, next_activity_at, notas, integration_client_id
  ) values (
    trim(p_data->>'nombre'), c.business_unit, 'otro', c.owner_id, v_company, v_contact, v_etapa,
    v_moneda,
    coalesce((p_data->>'monto_estimado')::numeric, 0),
    case when v_moneda = 'MXN' then null else (p_data->>'tipo_cambio_estimado')::numeric end,
    coalesce((p_data->>'probabilidad')::smallint, 0),
    (p_data->>'fecha_cierre_estimada')::date,
    (p_data->>'next_activity_at')::timestamptz,
    public.integration_mark_notes(c.etiqueta, p_data->>'notas'),
    c.id
  )
  returning id into v_id;

  perform public.integration_log(c.id, 'create_opportunity', v_id);
  return public.integration_opportunity_json(v_id);
end;
$$;

create or replace function public.integration_list_opportunities(p_key_hash text, p_etapa text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c      public.integration_clients;
  v_json jsonb;
begin
  c := public.integration_authenticate(p_key_hash);

  select coalesce(jsonb_agg(public.integration_opportunity_json(x.id) order by x.updated_at desc), '[]'::jsonb)
  into v_json
  from (
    select o.id, o.updated_at
    from public.opportunities o
    where o.integration_client_id = c.id
      and o.business_unit = c.business_unit
      and (p_etapa is null or o.etapa = p_etapa::public.opportunity_stage)
    order by o.updated_at desc
    limit 100
  ) x;

  perform public.integration_log(c.id, 'list_opportunities', null);
  return v_json;
end;
$$;

create or replace function public.integration_get_opportunity(p_key_hash text, p_opp_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c public.integration_clients;
begin
  c := public.integration_authenticate(p_key_hash);

  if not exists (
    select 1 from public.opportunities
    where id = p_opp_id and integration_client_id = c.id and business_unit = c.business_unit
  ) then
    raise exception 'Oportunidad no encontrada' using errcode = 'IN404';
  end if;

  perform public.integration_log(c.id, 'get_opportunity', p_opp_id);
  return public.integration_opportunity_json(p_opp_id);
end;
$$;

-- Actualización parcial: sólo se tocan las llaves presentes en p_data. Nunca owner_id,
-- business_unit, fuente, monto_final ni etapas cerradas.
create or replace function public.integration_update_opportunity(
  p_key_hash text, p_opp_id uuid, p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c        public.integration_clients;
  v_opp    public.opportunities;
  v_etapa  public.opportunity_stage;
  v_moneda public.currency;
begin
  c := public.integration_authenticate(p_key_hash);

  select * into v_opp from public.opportunities
  where id = p_opp_id and integration_client_id = c.id and business_unit = c.business_unit
  for update;

  if not found then
    raise exception 'Oportunidad no encontrada' using errcode = 'IN404';
  end if;
  if not public.integration_stage_allowed(v_opp.etapa) then
    raise exception 'La oportunidad está en %; sólo una persona puede modificarla', v_opp.etapa
      using errcode = 'IN403';
  end if;

  v_etapa  := coalesce((p_data->>'etapa')::public.opportunity_stage, v_opp.etapa);
  v_moneda := coalesce((p_data->>'moneda')::public.currency, v_opp.moneda);

  if not public.integration_stage_allowed(v_etapa) then
    raise exception 'La etapa % está reservada para intervención humana', v_etapa using errcode = 'IN403';
  end if;
  if p_data ? 'company_id' and p_data->>'company_id' is not null
     and not exists (select 1 from public.companies where id = (p_data->>'company_id')::uuid) then
    raise exception 'company_id no existe' using errcode = 'IN422';
  end if;
  if p_data ? 'contact_id' and p_data->>'contact_id' is not null
     and not exists (select 1 from public.contacts where id = (p_data->>'contact_id')::uuid) then
    raise exception 'contact_id no existe' using errcode = 'IN422';
  end if;

  update public.opportunities set
    nombre                = case when p_data ? 'nombre' then trim(p_data->>'nombre') else nombre end,
    etapa                 = v_etapa,
    moneda                = v_moneda,
    monto_estimado        = case when p_data ? 'monto_estimado' then (p_data->>'monto_estimado')::numeric else monto_estimado end,
    tipo_cambio_estimado  = case when v_moneda = 'MXN' then null
                                 when p_data ? 'tipo_cambio_estimado' then (p_data->>'tipo_cambio_estimado')::numeric
                                 else tipo_cambio_estimado end,
    probabilidad          = case when p_data ? 'probabilidad' then (p_data->>'probabilidad')::smallint else probabilidad end,
    fecha_cierre_estimada = case when p_data ? 'fecha_cierre_estimada' then (p_data->>'fecha_cierre_estimada')::date else fecha_cierre_estimada end,
    next_activity_at      = case when p_data ? 'next_activity_at' then (p_data->>'next_activity_at')::timestamptz else next_activity_at end,
    notas                 = case when p_data ? 'notas' then public.integration_mark_notes(c.etiqueta, p_data->>'notas') else notas end,
    company_id            = case when p_data ? 'company_id' then (p_data->>'company_id')::uuid else company_id end,
    contact_id            = case when p_data ? 'contact_id' then (p_data->>'contact_id')::uuid else contact_id end
  where id = p_opp_id;

  perform public.integration_log(c.id, 'update_opportunity', p_opp_id);
  return public.integration_opportunity_json(p_opp_id);
end;
$$;

create or replace function public.integration_create_activity(p_key_hash text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c         public.integration_clients;
  v_opp_id  uuid := (p_data->>'opportunity_id')::uuid;
  v_estatus public.activity_status := coalesce(p_data->>'estatus', 'pendiente')::public.activity_status;
  v_etapa   public.opportunity_stage;
  v_id      uuid;
begin
  c := public.integration_authenticate(p_key_hash);

  select etapa into v_etapa from public.opportunities
  where id = v_opp_id and integration_client_id = c.id and business_unit = c.business_unit;

  if not found then
    raise exception 'Oportunidad no encontrada' using errcode = 'IN404';
  end if;
  if not public.integration_stage_allowed(v_etapa) then
    raise exception 'La oportunidad está en %; sólo una persona puede registrarle actividades', v_etapa
      using errcode = 'IN403';
  end if;
  if v_estatus = 'cancelada' then
    raise exception 'Una actividad nueva sólo puede ser pendiente o completada' using errcode = 'IN422';
  end if;
  if nullif(trim(coalesce(p_data->>'titulo', '')), '') is null or p_data->>'fecha' is null then
    raise exception 'titulo y fecha son requeridos' using errcode = 'IN422';
  end if;

  insert into public.activities (
    opportunity_id, owner_id, tipo, estatus, titulo, descripcion, fecha, completed_at,
    integration_client_id
  ) values (
    v_opp_id, c.owner_id, (p_data->>'tipo')::public.activity_type, v_estatus,
    trim(p_data->>'titulo'), p_data->>'descripcion', (p_data->>'fecha')::timestamptz,
    case when v_estatus = 'completada' then now() end,
    c.id
  )
  returning id into v_id;

  perform public.integration_log(c.id, 'create_activity', v_id);
  return public.integration_opportunity_json(v_opp_id);
end;
$$;

create or replace function public.integration_update_activity(
  p_key_hash text, p_activity_id uuid, p_data jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c         public.integration_clients;
  v_act     public.activities;
  v_etapa   public.opportunity_stage;
  v_estatus public.activity_status;
begin
  c := public.integration_authenticate(p_key_hash);

  select a.* into v_act from public.activities a
  join public.opportunities o on o.id = a.opportunity_id
  where a.id = p_activity_id
    and a.integration_client_id = c.id
    and o.integration_client_id = c.id
    and o.business_unit = c.business_unit
  for update of a;

  if not found then
    raise exception 'Actividad no encontrada' using errcode = 'IN404';
  end if;

  select etapa into v_etapa from public.opportunities where id = v_act.opportunity_id;
  if not public.integration_stage_allowed(v_etapa) then
    raise exception 'La oportunidad está en %; sólo una persona puede modificar sus actividades', v_etapa
      using errcode = 'IN403';
  end if;

  v_estatus := coalesce((p_data->>'estatus')::public.activity_status, v_act.estatus);

  update public.activities set
    tipo         = case when p_data ? 'tipo' then (p_data->>'tipo')::public.activity_type else tipo end,
    titulo       = case when p_data ? 'titulo' then trim(p_data->>'titulo') else titulo end,
    descripcion  = case when p_data ? 'descripcion' then p_data->>'descripcion' else descripcion end,
    fecha        = case when p_data ? 'fecha' then (p_data->>'fecha')::timestamptz else fecha end,
    estatus      = v_estatus,
    completed_at = case when v_estatus = 'completada' then coalesce(completed_at, now()) end
  where id = p_activity_id;

  perform public.integration_log(c.id, 'update_activity', p_activity_id);
  return public.integration_opportunity_json(v_act.opportunity_id);
end;
$$;

-- Registro de fallos (la transacción de la operación fallida ya se revirtió, así que su
-- fila de auditoría no existe). Sólo registra si la key corresponde a un cliente.
create or replace function public.integration_log_failure(
  p_key_hash text, p_operacion text, p_error text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.integration_audit_log (client_id, operacion, ok, error)
  select id, p_operacion, false, left(p_error, 500)
  from public.integration_clients
  where key_hash = p_key_hash;
$$;

-- ============================================================
-- Administración de keys — sólo desde el SQL editor (rol postgres)
-- ============================================================

-- Devuelve la key en texto plano UNA sola vez; en la DB sólo queda su hash.
-- Volver a emitir reemplaza (invalida) la key anterior.
create or replace function public.integration_issue_key(p_client_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_key text := 'sint_' || encode(extensions.gen_random_bytes(32), 'hex');
begin
  update public.integration_clients
  set key_hash      = encode(extensions.digest(v_key, 'sha256'), 'hex'),
      key_prefix    = left(v_key, 12),
      key_issued_at = now(),
      revoked_at    = null
  where id = p_client_id;

  if not found then
    raise exception 'integration_client % no existe', p_client_id;
  end if;
  return v_key;
end;
$$;

create or replace function public.integration_revoke_key(p_client_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.integration_clients set revoked_at = now() where id = p_client_id;
$$;

-- ============================================================
-- Grants. Postgres concede EXECUTE a PUBLIC por defecto y Supabase además a
-- anon/authenticated/service_role: se revoca todo y se concede explícitamente.
-- ============================================================
do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'integration\_%'
  loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', fn);
  end loop;
end;
$$;

grant execute on function public.integration_lookup(text, text, text, text)              to service_role;
grant execute on function public.integration_get_company(text, uuid)                     to service_role;
grant execute on function public.integration_get_contact(text, uuid)                     to service_role;
grant execute on function public.integration_create_company(text, jsonb)                 to service_role;
grant execute on function public.integration_create_contact(text, jsonb)                 to service_role;
grant execute on function public.integration_create_opportunity(text, jsonb)             to service_role;
grant execute on function public.integration_list_opportunities(text, text)              to service_role;
grant execute on function public.integration_get_opportunity(text, uuid)                 to service_role;
grant execute on function public.integration_update_opportunity(text, uuid, jsonb)       to service_role;
grant execute on function public.integration_create_activity(text, jsonb)                to service_role;
grant execute on function public.integration_update_activity(text, uuid, jsonb)          to service_role;
grant execute on function public.integration_log_failure(text, text, text)               to service_role;
