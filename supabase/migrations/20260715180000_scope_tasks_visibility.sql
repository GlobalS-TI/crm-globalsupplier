-- Migration: escopar visibilidad del tablero de Actividades a creador/responsable
-- Sprint: post-deploy bug fix
--
-- tasks_select (y las políticas hermanas de task_column_values) permitían a
-- cualquier usuario activo ver TODAS las filas del tablero compartido
-- "Actividades Generales", sin importar quién las creó o a quién estaban
-- asignadas. Se reporta como invasivo: cada usuario debe ver únicamente sus
-- propias actividades (las que creó o las que tiene asignadas como
-- "Responsable"), sin excepción de rol — ni siquiera los roles con acceso
-- total en otros módulos (director_general, direccion_comercial, marketing,
-- administracion) deben ver actividades ajenas aquí.
--
-- "Responsable" hoy vive como un valor EAV de texto libre (task_column_values,
-- columna tipo 'person') sin FK a profiles. Se promueve a una columna real
-- tasks.assigned_to para poder filtrarla desde RLS de forma indexada y
-- consistente con las demás tablas con ownership (companies/contacts/
-- opportunities/activities).

-- ============================================================
-- 1. Promover "Responsable" a columna real
-- ============================================================
alter table public.tasks
  add column assigned_to uuid references public.profiles(id);

create index idx_tasks_assigned_to on public.tasks(assigned_to);

-- Backfill desde los valores EAV existentes de columnas tipo 'person'
update public.tasks t
set assigned_to = tcv.value::uuid
from public.task_column_values tcv
join public.task_board_columns c on c.id = tcv.column_id
where tcv.task_id = t.id
  and c.tipo = 'person'
  and tcv.value is not null
  and tcv.value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ============================================================
-- 2. tasks: visible/editable/borrable solo por creador o responsable
-- ============================================================
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (
    created_by = auth.uid() or assigned_to = auth.uid()
  );

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks
  for update using (
    created_by = auth.uid() or assigned_to = auth.uid()
  );

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks
  for delete using (
    created_by = auth.uid() or assigned_to = auth.uid()
  );

-- ============================================================
-- 3. task_column_values: visible/editable solo si se puede ver/editar
--    la tarea a la que pertenecen (misma regla que arriba)
-- ============================================================
drop policy if exists "task_column_values_select" on public.task_column_values;
create policy "task_column_values_select" on public.task_column_values
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_column_values.task_id
        and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

drop policy if exists "task_column_values_insert" on public.task_column_values;
create policy "task_column_values_insert" on public.task_column_values
  for insert with check (
    exists (
      select 1 from public.tasks t
      where t.id = task_column_values.task_id
        and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

drop policy if exists "task_column_values_update" on public.task_column_values;
create policy "task_column_values_update" on public.task_column_values
  for update using (
    exists (
      select 1 from public.tasks t
      where t.id = task_column_values.task_id
        and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

drop policy if exists "task_column_values_delete" on public.task_column_values;
create policy "task_column_values_delete" on public.task_column_values
  for delete using (
    exists (
      select 1 from public.tasks t
      where t.id = task_column_values.task_id
        and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
    )
  );

-- Nota: task_boards, task_board_columns y task_groups permanecen visibles
-- para todo usuario activo — son estructura compartida del tablero (nombre,
-- definición de columnas, secciones), no contenido de actividades. El
-- contenido sensible (tasks, task_column_values) ya queda escopado arriba.
