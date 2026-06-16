-- Migration: task board with dynamic columns (Monday.com-style)
-- Sprint: 8

-- ============================================================
-- Enum: column types
-- ============================================================
create type public.task_column_type as enum (
  'text', 'number', 'date', 'selector', 'person', 'url', 'business_unit'
);

-- ============================================================
-- Boards  (one per company initially; can grow to many)
-- ============================================================
create table public.task_boards (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null default 'Actividades Generales',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Dynamic column definitions
-- ============================================================
create table public.task_board_columns (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references public.task_boards(id) on delete cascade,
  nombre     text not null,
  tipo       public.task_column_type not null default 'text',
  position   integer not null default 0,
  config     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_task_board_columns_board on public.task_board_columns(board_id, position);

-- ============================================================
-- Tasks (rows in the board) — titulo + fecha_entrega are core
-- ============================================================
create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  board_id       uuid not null references public.task_boards(id) on delete cascade,
  titulo         text not null,
  fecha_entrega  date,
  opportunity_id uuid references public.opportunities(id) on delete set null,
  created_by     uuid not null references public.profiles(id),
  position       integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_tasks_board_fecha on public.tasks(board_id, fecha_entrega nulls last);
create index idx_tasks_created_by   on public.tasks(created_by);

-- ============================================================
-- EAV: one row per (task, column) pair
-- ============================================================
create table public.task_column_values (
  task_id   uuid not null references public.tasks(id) on delete cascade,
  column_id uuid not null references public.task_board_columns(id) on delete cascade,
  value     text,
  primary key (task_id, column_id)
);

-- ============================================================
-- Auto-update tasks.updated_at
-- ============================================================
create or replace function public.update_task_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.update_task_updated_at();

-- ============================================================
-- RLS
-- ============================================================
alter table public.task_boards        enable row level security;
alter table public.task_board_columns enable row level security;
alter table public.tasks              enable row level security;
alter table public.task_column_values enable row level security;

-- Boards: any active user can view; only full_access can create
create policy "task_boards_select" on public.task_boards
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_boards_insert" on public.task_boards
  for insert with check (
    is_full_access() and created_by = auth.uid()
  );

-- Board columns: any active user can view, add, or modify
create policy "task_board_columns_select" on public.task_board_columns
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_board_columns_insert" on public.task_board_columns
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_board_columns_update" on public.task_board_columns
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_board_columns_delete" on public.task_board_columns
  for delete using (is_full_access());

-- Tasks: all active users can view + create; created_by or full_access can delete
create policy "tasks_select" on public.tasks
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "tasks_insert" on public.tasks
  for insert with check (
    created_by = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "tasks_update" on public.tasks
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "tasks_delete" on public.tasks
  for delete using (
    created_by = auth.uid() or is_full_access()
  );

-- Column values: all active users can read and write (shared board)
create policy "task_column_values_select" on public.task_column_values
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_column_values_insert" on public.task_column_values
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_column_values_update" on public.task_column_values
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );

create policy "task_column_values_delete" on public.task_column_values
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_active = true)
  );
