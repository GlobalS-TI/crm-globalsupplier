-- Migration: corregir gaps de is_active restantes tras 20260626120000
-- Sprint: post-deploy bug fix
--
-- 1. owns_opportunity() no verificaba is_active — vendedor desactivado
--    podía acceder a activities de sus oportunidades.
-- 2. activities (SELECT/INSERT/UPDATE/DELETE): ramal owner_id = auth.uid()
--    sin is_active; ramal owns_opportunity() tampoco lo verificaba.
-- 3. leads_select: ramal vendedor_id = auth.uid() sin is_active.
-- 4. tasks_delete: ramal created_by = auth.uid() sin is_active.
-- 5. task_boards_update/delete (añadidos en 20260626100000): ramal
--    created_by = auth.uid() sin is_active.

-- ── 1. Actualizar owns_opportunity para verificar is_active ──────

create or replace function public.owns_opportunity(opp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.opportunities o
    join public.profiles p on p.id = auth.uid()
    where o.id = opp_id
      and o.owner_id = auth.uid()
      and p.is_active = true
  );
$$;

-- ── 2. Recrear políticas de activities ──────────────────────────

drop policy activities_select on public.activities;
drop policy activities_insert on public.activities;
drop policy activities_update on public.activities;
drop policy activities_delete on public.activities;

create policy activities_select on public.activities
  for select to authenticated
  using (
    public.is_full_access()
    or (owner_id = auth.uid() and public.is_active_owner())
    or public.owns_opportunity(opportunity_id)
  );

create policy activities_insert on public.activities
  for insert to authenticated
  with check (
    public.is_full_access()
    or (owner_id = auth.uid() and public.is_active_owner())
    or public.owns_opportunity(opportunity_id)
  );

create policy activities_update on public.activities
  for update to authenticated
  using (
    public.is_full_access()
    or (owner_id = auth.uid() and public.is_active_owner())
    or public.owns_opportunity(opportunity_id)
  )
  with check (
    public.is_full_access()
    or (owner_id = auth.uid() and public.is_active_owner())
    or public.owns_opportunity(opportunity_id)
  );

create policy activities_delete on public.activities
  for delete to authenticated
  using (
    public.is_full_access()
    or (owner_id = auth.uid() and public.is_active_owner())
    or public.owns_opportunity(opportunity_id)
  );

-- ── 3. Recrear leads_select ─────────────────────────────────────

drop policy "leads_select" on public.leads;

create policy "leads_select" on public.leads
  for select to authenticated
  using (
    public.can_manage_leads()
    or (vendedor_id = auth.uid() and public.is_active_owner())
  );

-- ── 4. Recrear tasks_delete ─────────────────────────────────────

drop policy "tasks_delete" on public.tasks;

create policy "tasks_delete" on public.tasks
  for delete to authenticated
  using (
    (created_by = auth.uid() and public.is_active_owner())
    or public.is_full_access()
  );

-- ── 5. Recrear task_boards UPDATE/DELETE (corrección de 20260626100000) ──

drop policy "task_boards_update" on public.task_boards;
drop policy "task_boards_delete" on public.task_boards;

create policy "task_boards_update" on public.task_boards
  for update to authenticated
  using (
    (created_by = auth.uid() and public.is_active_owner())
    or public.is_full_access()
  )
  with check (
    (created_by = auth.uid() and public.is_active_owner())
    or public.is_full_access()
  );

create policy "task_boards_delete" on public.task_boards
  for delete to authenticated
  using (
    (created_by = auth.uid() and public.is_active_owner())
    or public.is_full_access()
  );
