-- Migration: custom groups for task board (replaces implicit month grouping)
-- Sprint: 8

-- ============================================================
-- Task groups — user-defined sections within a board
-- ============================================================
create table public.task_groups (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.task_boards(id) on delete cascade,
  nombre     text not null,
  color      text not null default '#f97316',
  position   integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_task_groups_board on public.task_groups(board_id, position);

-- Add group_id to tasks (nullable → ungrouped tasks go to "Sin grupo" section)
alter table public.tasks
  add column group_id uuid references public.task_groups(id) on delete set null;

create index idx_tasks_group on public.tasks(group_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.task_groups enable row level security;

create policy "task_groups_select" on public.task_groups
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_groups_insert" on public.task_groups
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_groups_update" on public.task_groups
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_groups_delete" on public.task_groups
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );
