-- Migration: opportunity_costs
-- Sprint: Comisiones

create table public.opportunity_costs (
  opportunity_id uuid primary key references public.opportunities(id) on delete cascade,
  costo          numeric(12, 2) not null default 0,
  notas          text,
  created_by     uuid references public.profiles(id) on delete set null,
  updated_at     timestamptz not null default now()
);

create index on public.opportunity_costs (opportunity_id);

-- Función helper para rol de comisiones
create or replace function public.is_comisiones_viewer()
returns boolean
language sql
stable
security definer
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid())
      in ('director_general', 'administracion'),
    false
  )
$$;

-- RLS
alter table public.opportunity_costs enable row level security;

create policy "comisiones_select"
  on public.opportunity_costs for select
  using (public.is_comisiones_viewer());

create policy "comisiones_insert"
  on public.opportunity_costs for insert
  with check (public.is_comisiones_viewer());

create policy "comisiones_update"
  on public.opportunity_costs for update
  using (public.is_comisiones_viewer())
  with check (public.is_comisiones_viewer());

create policy "comisiones_delete"
  on public.opportunity_costs for delete
  using (public.is_comisiones_viewer());
