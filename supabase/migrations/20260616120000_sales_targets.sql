-- Migration: metas de venta por vendedor por mes
-- Sprint: 8

create table public.sales_targets (
  id            uuid primary key default gen_random_uuid(),
  vendedor_id   uuid not null references public.profiles(id) on delete cascade,
  year          integer not null check (year between 2020 and 2100),
  month         integer not null check (month between 1 and 12),
  target_amount numeric(14, 2) not null default 0 check (target_amount >= 0),
  created_by    uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint sales_targets_unique unique (vendedor_id, year, month)
);

create index idx_sales_targets_vendedor_year on public.sales_targets (vendedor_id, year);

-- updated_at auto-refresh
create trigger trg_sales_targets_updated_at
  before update on public.sales_targets
  for each row execute function public.set_updated_at();

-- RLS
alter table public.sales_targets enable row level security;

-- All authenticated active users can read targets (directors compare across sellers)
create policy sales_targets_select on public.sales_targets
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_active
    )
  );

-- Only directors can write
create policy sales_targets_insert on public.sales_targets
  for insert to authenticated
  with check (public.is_full_access());

create policy sales_targets_update on public.sales_targets
  for update to authenticated
  using (public.is_full_access())
  with check (public.is_full_access());

create policy sales_targets_delete on public.sales_targets
  for delete to authenticated
  using (public.is_full_access());
