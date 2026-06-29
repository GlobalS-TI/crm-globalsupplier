-- Migration: projects_rls_delete_and_updates_policies
-- Sprint: 6
-- Razón: faltaba política DELETE en projects (bloqueaba silenciosamente),
--        y project_updates no tenía RLS habilitado.

-- DELETE de proyectos: solo director_general y direccion_comercial
create policy projects_delete on public.projects
  for delete to authenticated
  using (
    (select role from public.profiles where id = auth.uid())
    in ('director_general', 'direccion_comercial')
  );

-- RLS para project_updates (tabla creada sin políticas)
alter table public.project_updates enable row level security;

create policy project_updates_select on public.project_updates
  for select to authenticated using (public.is_project_team());

create policy project_updates_insert on public.project_updates
  for insert to authenticated with check (public.is_project_team());
