-- Migration: director_general_tasks_read_access
-- Sprint: post-deploy bug fix
--
-- El tablero de Actividades (tasks/task_column_values) quedó escopado en
-- 20260715180000_scope_tasks_visibility.sql a creador/responsable únicamente,
-- sin excepción de rol. Se pide ahora una excepción puntual: director_general
-- necesita poder revisar (solo lectura) las actividades registradas por
-- cualquier usuario desde la UI, seleccionando un usuario de una lista.
-- El resto de roles con acceso total en otros módulos (direccion_comercial,
-- marketing, administracion) NO ganan esta visibilidad — se pidió
-- explícitamente que sea exclusivo de director_general.
--
-- Solo se amplía SELECT: director_general sigue sin poder crear, editar ni
-- borrar tareas ajenas (tasks_insert/update/delete y
-- task_column_values_insert/update/delete permanecen sin cambios).

create or replace function public.is_director_general()
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
      and role = 'director_general'
  );
$$;

drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (
    created_by = auth.uid()
    or assigned_to = auth.uid()
    or public.is_director_general()
  );

drop policy if exists "task_column_values_select" on public.task_column_values;
create policy "task_column_values_select" on public.task_column_values
  for select using (
    exists (
      select 1 from public.tasks t
      where t.id = task_column_values.task_id
        and (
          t.created_by = auth.uid()
          or t.assigned_to = auth.uid()
          or public.is_director_general()
        )
    )
  );
