-- Migration: pipeline de cotización → pedido → factura para juno_promotional
-- Sprint: release-2
-- ADR-007
--
-- Cuelga de opportunities (business_unit = juno_promotional) igual que
-- opportunity_costs. La cotización y el pedido se generan hoy fuera del CRM
-- (Excel/PDF, y a futuro una app dedicada) — aquí solo se versiona el
-- seguimiento y se guarda el link al documento. La factura es opcional por
-- diseño: no toda orden tiene fila en `invoices`.

-- ----------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------
create type public.quote_status as enum ('borrador', 'enviada', 'aceptada', 'rechazada');
create type public.order_status as enum ('revision_cliente', 'aprobado', 'cancelado');

-- ----------------------------------------------------------------
-- quotes (cotizaciones) — versionadas, 1:N por oportunidad
-- ----------------------------------------------------------------
create table public.quotes (
  id              uuid        primary key default gen_random_uuid(),
  opportunity_id  uuid        not null references public.opportunities(id) on delete cascade,
  version         int         not null default 1,
  status          public.quote_status not null default 'borrador',
  document_url    text,       -- PDF/excel ya generado (Storage o link externo)
  external_ref    text,       -- id en la futura app de cotizaciones
  notas           text,
  created_by      uuid        references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (opportunity_id, version)
);

create index idx_quotes_opportunity on public.quotes(opportunity_id);

create trigger trg_quotes_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- orders (pedidos) — versionados, ligados a la cotización aceptada
-- ----------------------------------------------------------------
create table public.orders (
  id              uuid        primary key default gen_random_uuid(),
  opportunity_id  uuid        not null references public.opportunities(id) on delete cascade,
  quote_id        uuid        not null references public.quotes(id),
  version         int         not null default 1,
  status          public.order_status not null default 'revision_cliente',
  document_url    text,
  external_ref    text,
  notas           text,
  created_by      uuid        references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (opportunity_id, version)
);

create index idx_orders_opportunity on public.orders(opportunity_id);
create index idx_orders_quote       on public.orders(quote_id);

create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- order_providers — un pedido puede repartirse entre varios proveedores
-- ----------------------------------------------------------------
create table public.order_providers (
  id          uuid        primary key default gen_random_uuid(),
  order_id    uuid        not null references public.orders(id) on delete cascade,
  proveedor   text        not null,
  monto       numeric(12, 2),
  notas       text,
  created_at  timestamptz not null default now()
);

create index idx_order_providers_order on public.order_providers(order_id);

-- ----------------------------------------------------------------
-- invoices (facturas) — opcional: no toda orden factura
-- ----------------------------------------------------------------
create table public.invoices (
  id            uuid        primary key default gen_random_uuid(),
  order_id      uuid        not null references public.orders(id) on delete cascade,
  folio         text,
  monto         numeric(12, 2),
  document_url  text,
  created_by    uuid        references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_invoices_order on public.invoices(order_id);

create trigger trg_invoices_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- Guardas de integridad (defensa en profundidad, además del Zod/service):
--   * quotes/orders solo para oportunidades de juno_promotional
--   * el pedido debe apuntar a una cotización de la misma oportunidad
-- ----------------------------------------------------------------
create or replace function public.check_juno_opportunity(opp_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.opportunities
    where id = opp_id and business_unit = 'juno_promotional'
  );
$$;

create or replace function public.trg_check_quote_business_unit()
returns trigger language plpgsql as $$
begin
  if not public.check_juno_opportunity(new.opportunity_id) then
    raise exception 'quotes solo pueden crearse para oportunidades de juno_promotional';
  end if;
  return new;
end;
$$;

create trigger trg_quotes_business_unit
  before insert on public.quotes
  for each row execute function public.trg_check_quote_business_unit();

create or replace function public.trg_check_order_consistency()
returns trigger language plpgsql as $$
begin
  if not public.check_juno_opportunity(new.opportunity_id) then
    raise exception 'orders solo pueden crearse para oportunidades de juno_promotional';
  end if;
  if not exists (
    select 1 from public.quotes
    where id = new.quote_id and opportunity_id = new.opportunity_id
  ) then
    raise exception 'quote_id debe pertenecer a la misma oportunidad que el pedido';
  end if;
  return new;
end;
$$;

create trigger trg_orders_consistency
  before insert on public.orders
  for each row execute function public.trg_check_order_consistency();

-- ----------------------------------------------------------------
-- RLS — mismo modelo que opportunities (ADR-003, ownership-based, Sprint 0):
-- full access ve todo, vendedor solo lo de las oportunidades que posee.
-- ----------------------------------------------------------------
create or replace function public.owns_order(ord_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.orders o
    where o.id = ord_id
      and (public.is_full_access() or public.owns_opportunity(o.opportunity_id))
  );
$$;

grant execute on function public.check_juno_opportunity(uuid) to authenticated;
grant execute on function public.owns_order(uuid) to authenticated;

alter table public.quotes          enable row level security;
alter table public.orders          enable row level security;
alter table public.order_providers enable row level security;
alter table public.invoices        enable row level security;

create policy quotes_select on public.quotes for select to authenticated
  using (public.is_full_access() or public.owns_opportunity(opportunity_id));
create policy quotes_insert on public.quotes for insert to authenticated
  with check (public.is_full_access() or public.owns_opportunity(opportunity_id));
create policy quotes_update on public.quotes for update to authenticated
  using (public.is_full_access() or public.owns_opportunity(opportunity_id))
  with check (public.is_full_access() or public.owns_opportunity(opportunity_id));
create policy quotes_delete on public.quotes for delete to authenticated
  using (public.is_full_access() or public.owns_opportunity(opportunity_id));

create policy orders_select on public.orders for select to authenticated
  using (public.is_full_access() or public.owns_opportunity(opportunity_id));
create policy orders_insert on public.orders for insert to authenticated
  with check (public.is_full_access() or public.owns_opportunity(opportunity_id));
create policy orders_update on public.orders for update to authenticated
  using (public.is_full_access() or public.owns_opportunity(opportunity_id))
  with check (public.is_full_access() or public.owns_opportunity(opportunity_id));
create policy orders_delete on public.orders for delete to authenticated
  using (public.is_full_access() or public.owns_opportunity(opportunity_id));

create policy order_providers_select on public.order_providers for select to authenticated
  using (public.owns_order(order_id));
create policy order_providers_insert on public.order_providers for insert to authenticated
  with check (public.owns_order(order_id));
create policy order_providers_update on public.order_providers for update to authenticated
  using (public.owns_order(order_id)) with check (public.owns_order(order_id));
create policy order_providers_delete on public.order_providers for delete to authenticated
  using (public.owns_order(order_id));

create policy invoices_select on public.invoices for select to authenticated
  using (public.owns_order(order_id));
create policy invoices_insert on public.invoices for insert to authenticated
  with check (public.owns_order(order_id));
create policy invoices_update on public.invoices for update to authenticated
  using (public.owns_order(order_id)) with check (public.owns_order(order_id));
create policy invoices_delete on public.invoices for delete to authenticated
  using (public.owns_order(order_id));

grant select, insert, update, delete on public.quotes          to authenticated, service_role;
grant select, insert, update, delete on public.orders          to authenticated, service_role;
grant select, insert, update, delete on public.order_providers to authenticated, service_role;
grant select, insert, update, delete on public.invoices        to authenticated, service_role;
