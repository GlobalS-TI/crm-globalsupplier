-- Migration: projects_delete_policy_fix
-- Sprint: 6
-- Razón: la migración 040000 puede no haberse aplicado en todos los entornos.
--        Esta migración es idempotente y usa security definer al igual que
--        is_project_team() y is_full_access() para evitar problemas de RLS recursivo.

-- Función security definer para roles con permiso de borrar proyectos
create or replace function public.is_project_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id       = auth.uid()
      and is_active
      and role in ('director_general', 'direccion_comercial')
  );
$$;

grant execute on function public.is_project_admin() to authenticated;

-- DELETE policy — idempotente
drop policy if exists projects_delete on public.projects;

create policy projects_delete on public.projects
  for delete to authenticated
  using (public.is_project_admin());

-- RLS en project_updates (puede ya existir de 040000, idempotente)
alter table public.project_updates enable row level security;

drop policy if exists project_updates_select on public.project_updates;
drop policy if exists project_updates_insert on public.project_updates;

create policy project_updates_select on public.project_updates
  for select to authenticated using (public.is_project_team());

create policy project_updates_insert on public.project_updates
  for insert to authenticated with check (public.is_project_team());
