-- Migration: admin_permissions_and_project_gates
-- Sprint: 6

-- Adds is_admin() helper and ensures `administracion` role bypasses
-- all visibility and management gates across leads, projects, and content.
-- Also restricts project create/delete to directors + administracion only.

-- ─── Helper: is_admin ────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'administracion'
      and is_active
  )
$$;

grant execute on function public.is_admin() to authenticated;

-- ─── Leads: add administracion to both helper functions ──────────────────────

create or replace function public.is_leads_manager()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role in ('marketing', 'director_general', 'administracion')
  )
$$;

create or replace function public.can_manage_leads()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role in ('marketing', 'director_general', 'direccion_comercial', 'administracion')
  )
$$;

-- ─── Projects: restrict create/delete to directors + administracion ──────────

-- Helper: who can create or delete projects
create or replace function public.can_manage_projects()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role in ('director_general', 'direccion_comercial', 'administracion')
  )
$$;

grant execute on function public.can_manage_projects() to authenticated;

-- Replace INSERT policy (was is_project_team which included marketing)
drop policy if exists projects_insert on public.projects;
create policy projects_insert on public.projects
  for insert to authenticated
  with check (public.can_manage_projects());

-- Replace DELETE policy (was director_general + direccion_comercial only)
drop policy if exists projects_delete on public.projects;
create policy projects_delete on public.projects
  for delete to authenticated
  using (public.can_manage_projects());

-- ─── Content: add administracion to visibility ───────────────────────────────

-- The content module helper only had marketing + director_general.
-- Replace it so TI can access the content library too.
create or replace function public.is_content_team()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role in ('marketing', 'director_general', 'administracion')
  )
$$;

grant execute on function public.is_content_team() to authenticated;

-- Update content_categories policies
drop policy if exists content_categories_select on public.content_categories;
drop policy if exists content_categories_insert on public.content_categories;
drop policy if exists content_categories_update on public.content_categories;
drop policy if exists content_categories_delete on public.content_categories;

create policy content_categories_select on public.content_categories
  for select to authenticated using (public.is_content_team());
create policy content_categories_insert on public.content_categories
  for insert to authenticated with check (public.is_content_team());
create policy content_categories_update on public.content_categories
  for update to authenticated using (public.is_content_team()) with check (public.is_content_team());
create policy content_categories_delete on public.content_categories
  for delete to authenticated using (public.is_content_team());

-- Update content_items policies
drop policy if exists content_items_select on public.content_items;
drop policy if exists content_items_insert on public.content_items;
drop policy if exists content_items_update on public.content_items;
drop policy if exists content_items_delete on public.content_items;

create policy content_items_select on public.content_items
  for select to authenticated using (public.is_content_team());
create policy content_items_insert on public.content_items
  for insert to authenticated with check (public.is_content_team());
create policy content_items_update on public.content_items
  for update to authenticated using (public.is_content_team()) with check (public.is_content_team());
create policy content_items_delete on public.content_items
  for delete to authenticated using (public.is_content_team());
