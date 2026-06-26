-- Migration: agregar políticas UPDATE y DELETE faltantes en task_boards y project_files
-- Sprint: post-deploy bug fix

-- task_boards: cualquier usuario activo puede actualizar/borrar boards que creó;
-- full_access puede actualizar/borrar cualquier board.
create policy "task_boards_update" on public.task_boards
  for update to authenticated
  using (
    created_by = auth.uid()
    or public.is_full_access()
  )
  with check (
    created_by = auth.uid()
    or public.is_full_access()
  );

create policy "task_boards_delete" on public.task_boards
  for delete to authenticated
  using (
    created_by = auth.uid()
    or public.is_full_access()
  );

-- project_files: UPDATE alineado con el patrón existente de SELECT/INSERT/DELETE
create policy project_files_update on public.project_files
  for update to authenticated
  using (public.is_project_team())
  with check (public.is_project_team());
