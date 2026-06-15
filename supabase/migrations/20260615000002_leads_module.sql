-- Migration: leads module — sections, leads, RLS
-- Sprint: 7A

-- ============================================================
-- Helper: section managers (marketing + director_general only)
-- ============================================================
create or replace function public.is_leads_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role in ('marketing', 'director_general')
  );
$$;

grant execute on function public.is_leads_manager() to authenticated;

-- ============================================================
-- Helper: can manage leads (mkt + director + direccion_comercial)
-- ============================================================
create or replace function public.can_manage_leads()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role in ('marketing', 'director_general', 'direccion_comercial')
  );
$$;

grant execute on function public.can_manage_leads() to authenticated;

-- ============================================================
-- lead_sections — campaign / list containers
-- ============================================================
create table public.lead_sections (
  id          uuid        primary key default gen_random_uuid(),
  nombre      text        not null,
  descripcion text,
  created_by  uuid        not null references public.profiles(id),
  created_at  timestamptz not null default now()
);

alter table public.lead_sections enable row level security;

-- Everyone can read sections (vendedores need to know which section their leads belong to)
create policy "lead_sections_select"
  on public.lead_sections for select to authenticated
  using (true);

create policy "lead_sections_insert"
  on public.lead_sections for insert to authenticated
  with check (public.is_leads_manager());

create policy "lead_sections_update"
  on public.lead_sections for update to authenticated
  using (public.is_leads_manager()) with check (public.is_leads_manager());

create policy "lead_sections_delete"
  on public.lead_sections for delete to authenticated
  using (public.is_leads_manager());

-- ============================================================
-- leads
-- ============================================================
create table public.leads (
  id                       uuid        primary key default gen_random_uuid(),
  section_id               uuid        not null references public.lead_sections(id) on delete cascade,
  nombre                   text        not null,
  empresa                  text,
  email                    text,
  telefono                 text,
  requerimientos           text,
  requirements_file_path   text,         -- path inside storage bucket 'media'
  assigned_to              uuid        references public.profiles(id),
  converted_opportunity_id uuid        references public.opportunities(id) on delete set null,
  created_by               uuid        not null references public.profiles(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

alter table public.leads enable row level security;

-- SELECT:
--   managers (mkt + director + dir_comercial) → see all
--   vendedores → only their assigned leads
create policy "leads_select"
  on public.leads for select to authenticated
  using (
    public.can_manage_leads()
    or assigned_to = auth.uid()
  );

-- INSERT / UPDATE: managers only (dir_comercial included for reassignment)
create policy "leads_insert"
  on public.leads for insert to authenticated
  with check (public.can_manage_leads());

create policy "leads_update"
  on public.leads for update to authenticated
  using (public.can_manage_leads()) with check (public.can_manage_leads());

-- DELETE: only mkt + director_general
create policy "leads_delete"
  on public.leads for delete to authenticated
  using (public.is_leads_manager());

-- updated_at trigger (reuse pattern from opportunities)
create trigger leads_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- Performance indexes
create index leads_section_id_idx        on public.leads (section_id);
create index leads_assigned_to_idx       on public.leads (assigned_to);
create index leads_converted_opp_idx     on public.leads (converted_opportunity_id) where converted_opportunity_id is not null;
create index lead_sections_created_at_idx on public.lead_sections (created_at desc);
