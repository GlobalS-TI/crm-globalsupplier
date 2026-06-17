-- Migration: módulo de proyectos internos
-- Sprint: release-1

-- ----------------------------------------------------------------
-- Helper: roles con acceso al módulo de proyectos
-- ----------------------------------------------------------------
create or replace function public.is_project_team()
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.profiles
    where id    = auth.uid()
      and is_active
      and role in ('marketing', 'director_general', 'administracion')
  )
$$;

-- ----------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------
create type public.project_status as enum (
  'INCOMING', 'ANALYSIS', 'DESIGN', 'DEVELOPMENT', 'QA', 'DELIVERED'
);

create type public.project_file_type as enum (
  'FIGMA', 'REPO', 'ASSET', 'DOC', 'OTHER'
);

-- ----------------------------------------------------------------
-- projects
-- ----------------------------------------------------------------
create table public.projects (
  id              uuid        primary key default gen_random_uuid(),
  title           text        not null,
  description     text,
  brand           text        not null,   -- validated as BusinessUnit at app layer
  status          public.project_status not null default 'INCOMING',
  stakeholder_id  uuid        references public.profiles(id),
  requested_by_id uuid        references public.profiles(id),
  due_date        date,
  estimated_hours numeric(6,1),
  created_by      uuid        references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create index idx_projects_brand  on public.projects(brand);
create index idx_projects_status on public.projects(status);

-- ----------------------------------------------------------------
-- project_briefs  (1:1)
-- ----------------------------------------------------------------
create table public.project_briefs (
  id               uuid        primary key default gen_random_uuid(),
  project_id       uuid        not null unique references public.projects(id) on delete cascade,
  what             text,
  why              text,
  deadline_real    date,
  deadline_desired date,
  notes            text,
  updated_at       timestamptz not null default now()
);

create trigger trg_project_briefs_updated_at
  before update on public.project_briefs
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- project_stage_logs  (1:N, append-only audit)
-- ----------------------------------------------------------------
create table public.project_stage_logs (
  id          uuid                  primary key default gen_random_uuid(),
  project_id  uuid                  not null references public.projects(id) on delete cascade,
  from_status public.project_status,          -- null en la entrada inicial (creación)
  to_status   public.project_status not null,
  changed_by  uuid                  references public.profiles(id),
  comment     text,
  changed_at  timestamptz           not null default now()
);

create index idx_project_stage_logs_project on public.project_stage_logs(project_id);

-- ----------------------------------------------------------------
-- project_handoff_checklists  (1:1)
-- ----------------------------------------------------------------
create table public.project_handoff_checklists (
  id                     uuid        primary key default gen_random_uuid(),
  project_id             uuid        not null unique references public.projects(id) on delete cascade,
  component_states       boolean     not null default false,
  component_states_note  text,
  breakpoints_defined    boolean     not null default false,
  breakpoints_note       text,
  interactions_annotated boolean     not null default false,
  interactions_note      text,
  assets_exported        boolean     not null default false,
  assets_note            text,
  naming_convention      boolean     not null default false,
  naming_note            text,
  updated_at             timestamptz not null default now()
);

create trigger trg_project_handoff_updated_at
  before update on public.project_handoff_checklists
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- project_decision_logs  (1:N, append-only)
-- ----------------------------------------------------------------
create table public.project_decision_logs (
  id         uuid        primary key default gen_random_uuid(),
  project_id uuid        not null references public.projects(id) on delete cascade,
  entry      text        not null,
  author_id  uuid        references public.profiles(id),
  created_at timestamptz not null default now()
);

create index idx_project_decision_logs_project on public.project_decision_logs(project_id);

-- ----------------------------------------------------------------
-- project_files  (1:N)
-- ----------------------------------------------------------------
create table public.project_files (
  id         uuid                    primary key default gen_random_uuid(),
  project_id uuid                    not null references public.projects(id) on delete cascade,
  label      text                    not null,
  url        text                    not null,
  type       public.project_file_type not null default 'OTHER',
  created_at timestamptz             not null default now()
);

create index idx_project_files_project on public.project_files(project_id);

-- ----------------------------------------------------------------
-- RLS — solo marketing, director_general, administracion
-- ----------------------------------------------------------------
alter table public.projects                   enable row level security;
alter table public.project_briefs             enable row level security;
alter table public.project_stage_logs         enable row level security;
alter table public.project_handoff_checklists enable row level security;
alter table public.project_decision_logs      enable row level security;
alter table public.project_files              enable row level security;

-- projects: CRUD
create policy projects_select on public.projects for select to authenticated using (public.is_project_team());
create policy projects_insert on public.projects for insert to authenticated with check (public.is_project_team());
create policy projects_update on public.projects for update to authenticated using (public.is_project_team()) with check (public.is_project_team());

-- project_briefs: CRUD
create policy project_briefs_select on public.project_briefs for select to authenticated using (public.is_project_team());
create policy project_briefs_insert on public.project_briefs for insert to authenticated with check (public.is_project_team());
create policy project_briefs_update on public.project_briefs for update to authenticated using (public.is_project_team()) with check (public.is_project_team());

-- project_stage_logs: lectura + insert (audit trail inmutable)
create policy project_stage_logs_select on public.project_stage_logs for select to authenticated using (public.is_project_team());
create policy project_stage_logs_insert on public.project_stage_logs for insert to authenticated with check (public.is_project_team());

-- project_handoff_checklists: CRUD
create policy project_handoff_select on public.project_handoff_checklists for select to authenticated using (public.is_project_team());
create policy project_handoff_insert on public.project_handoff_checklists for insert to authenticated with check (public.is_project_team());
create policy project_handoff_update on public.project_handoff_checklists for update to authenticated using (public.is_project_team()) with check (public.is_project_team());

-- project_decision_logs: lectura + insert (append-only)
create policy project_decision_logs_select on public.project_decision_logs for select to authenticated using (public.is_project_team());
create policy project_decision_logs_insert on public.project_decision_logs for insert to authenticated with check (public.is_project_team());

-- project_files: CRUD (los links se pueden eliminar)
create policy project_files_select on public.project_files for select to authenticated using (public.is_project_team());
create policy project_files_insert on public.project_files for insert to authenticated with check (public.is_project_team());
create policy project_files_delete on public.project_files for delete to authenticated using (public.is_project_team());
