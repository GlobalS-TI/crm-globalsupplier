-- Migration: initial schema — enums, tables, indexes, grants
-- Sprint: 0

-- ============================================================
-- Enums (mirror lib/types/index.ts)
-- ============================================================
create type public.user_role as enum (
  'director_general', 'direccion_comercial', 'vendedor', 'marketing', 'administracion'
);

create type public.business_unit as enum (
  'global_supplier_mty', 'thunder_safety', 'thunder_led', 'got_fresh_breath',
  'gtx_systems', 'juno_promotional', 'fire_spot'
);

create type public.opportunity_stage as enum (
  'nuevo_lead', 'contactado', 'diagnostico', 'cotizacion_enviada',
  'seguimiento', 'negociacion', 'ganado', 'perdido'
);

create type public.lead_source as enum (
  'referido', 'web', 'linkedin', 'llamada_en_frio', 'evento', 'alianza', 'otro'
);

create type public.activity_type as enum (
  'llamada', 'email', 'reunion', 'demo', 'propuesta', 'seguimiento', 'otro'
);

create type public.activity_status as enum (
  'pendiente', 'completada', 'cancelada'
);

-- ============================================================
-- profiles — 1:1 with auth.users
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  role        public.user_role not null default 'vendedor',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- A user can belong to several business units (bridge table)
create table public.profile_business_units (
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  business_unit public.business_unit not null,
  primary key (profile_id, business_unit)
);

-- ============================================================
-- companies
-- ============================================================
create table public.companies (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  rfc        text,
  industria  text,
  sitio_web  text,
  telefono   text,
  ciudad     text,
  estado     text,
  notas      text,
  owner_id   uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- contacts
-- ============================================================
create table public.contacts (
  id         uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete set null,
  nombre     text not null,
  apellido   text,
  puesto     text,
  email      text,
  telefono   text,
  celular    text,
  notas      text,
  owner_id   uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- opportunities
-- ============================================================
create table public.opportunities (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  company_id            uuid references public.companies(id) on delete set null,
  contact_id            uuid references public.contacts(id) on delete set null,
  owner_id              uuid not null references public.profiles(id),
  business_unit         public.business_unit not null,
  etapa                 public.opportunity_stage not null default 'nuevo_lead',
  fuente                public.lead_source not null,
  monto_estimado        numeric(14, 2) not null default 0 check (monto_estimado >= 0),
  monto_final           numeric(14, 2) check (monto_final is null or monto_final >= 0),
  probabilidad          smallint not null default 0 check (probabilidad between 0 and 100),
  fecha_cierre_estimada date,
  next_activity_at      timestamptz,
  last_activity_at      timestamptz not null default now(),
  stale                 boolean not null default false,
  notas                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  -- Business rule (lib rule 2): cannot reach 'ganado' without a positive final amount
  constraint opp_ganado_requires_monto_final
    check (etapa <> 'ganado' or (monto_final is not null and monto_final > 0))
);

-- ============================================================
-- activities — cascade delete from opportunities
-- ============================================================
create table public.activities (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  owner_id       uuid not null references public.profiles(id),
  tipo           public.activity_type not null,
  estatus        public.activity_status not null default 'pendiente',
  titulo         text not null,
  descripcion    text,
  fecha          timestamptz not null,
  completed_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ============================================================
-- Indexes (Phase 1: direct queries on < 1000 opps — see dashboard CLAUDE.md)
-- ============================================================
create index idx_companies_owner         on public.companies (owner_id);
create index idx_contacts_owner          on public.contacts (owner_id);
create index idx_contacts_company        on public.contacts (company_id);
create index idx_opp_owner               on public.opportunities (owner_id);
create index idx_opp_business_unit       on public.opportunities (business_unit);
create index idx_opp_etapa               on public.opportunities (etapa);
create index idx_opp_company             on public.opportunities (company_id);
create index idx_opp_fecha_cierre        on public.opportunities (fecha_cierre_estimada);
create index idx_opp_stale               on public.opportunities (stale) where stale;
create index idx_activities_opportunity  on public.activities (opportunity_id);
create index idx_activities_owner        on public.activities (owner_id);
create index idx_activities_estatus_fecha on public.activities (estatus, fecha);
create index idx_pbu_business_unit       on public.profile_business_units (business_unit);

-- ============================================================
-- Grants for API roles.
-- Cloud default auto_expose_new_tables flips to false (2026-05-30), so table
-- privileges must be granted explicitly. RLS (next migration) still gates rows.
-- anon gets schema usage only — no table access, so callers must authenticate.
-- ============================================================
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;
