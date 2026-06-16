-- Migration: corregir política de insert en task_boards
-- Sprint: 8
-- findOrCreateDefaultBoard corre para cualquier usuario activo al visitar
-- /actividades, pero la política original solo permitía is_full_access().
-- Los boards son una herramienta colaborativa interna — cualquier usuario
-- activo puede crearlos.

drop policy if exists "task_boards_insert" on public.task_boards;

create policy "task_boards_insert" on public.task_boards
  for insert with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_active = true
    )
  );
