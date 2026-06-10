-- Migration: row level security — helper functions and policies
-- Sprint: 0
--
-- ADR-003: RLS is the only permission enforcement layer.
-- Access model:
--   * Full access (all rows, read + write): director_general, direccion_comercial,
--     marketing, administracion
--   * vendedor: only rows they own (owner_id = auth.uid())
-- profile_business_units is organisational/reporting metadata and does NOT gate
-- visibility — visibility is ownership-based (product decision, Sprint 0).

-- ============================================================
-- Helpers. SECURITY DEFINER so they read profiles/opportunities bypassing RLS,
-- which avoids recursion when referenced inside policies.
-- ============================================================
create or replace function public.is_full_access()
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
      and role in ('director_general', 'direccion_comercial', 'marketing', 'administracion')
  );
$$;

create or replace function public.owns_opportunity(opp_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.opportunities
    where id = opp_id and owner_id = auth.uid()
  );
$$;

grant execute on function public.is_full_access() to authenticated;
grant execute on function public.owns_opportunity(uuid) to authenticated;

-- ============================================================
-- profiles — everyone authenticated can read (names needed for joins);
-- self or full access can update; only full access inserts/deletes.
-- Role changes are further gated by the enforce_role_immutable trigger.
-- ============================================================
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated using (true);

create policy profiles_insert on public.profiles
  for insert to authenticated with check (public.is_full_access());

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_full_access())
  with check (id = auth.uid() or public.is_full_access());

create policy profiles_delete on public.profiles
  for delete to authenticated using (public.is_full_access());

-- ============================================================
-- profile_business_units — readable by all authenticated; managed by full access.
-- ============================================================
alter table public.profile_business_units enable row level security;

create policy pbu_select on public.profile_business_units
  for select to authenticated using (true);

create policy pbu_insert on public.profile_business_units
  for insert to authenticated with check (public.is_full_access());

create policy pbu_update on public.profile_business_units
  for update to authenticated
  using (public.is_full_access()) with check (public.is_full_access());

create policy pbu_delete on public.profile_business_units
  for delete to authenticated using (public.is_full_access());

-- ============================================================
-- companies — owner-scoped for vendedor, full access for management.
-- ============================================================
alter table public.companies enable row level security;

create policy companies_select on public.companies
  for select to authenticated
  using (public.is_full_access() or owner_id = auth.uid());

create policy companies_insert on public.companies
  for insert to authenticated
  with check (public.is_full_access() or owner_id = auth.uid());

create policy companies_update on public.companies
  for update to authenticated
  using (public.is_full_access() or owner_id = auth.uid())
  with check (public.is_full_access() or owner_id = auth.uid());

create policy companies_delete on public.companies
  for delete to authenticated
  using (public.is_full_access() or owner_id = auth.uid());

-- ============================================================
-- contacts — owner-scoped (same filter as companies, per product decision).
-- ============================================================
alter table public.contacts enable row level security;

create policy contacts_select on public.contacts
  for select to authenticated
  using (public.is_full_access() or owner_id = auth.uid());

create policy contacts_insert on public.contacts
  for insert to authenticated
  with check (public.is_full_access() or owner_id = auth.uid());

create policy contacts_update on public.contacts
  for update to authenticated
  using (public.is_full_access() or owner_id = auth.uid())
  with check (public.is_full_access() or owner_id = auth.uid());

create policy contacts_delete on public.contacts
  for delete to authenticated
  using (public.is_full_access() or owner_id = auth.uid());

-- ============================================================
-- opportunities — owner-scoped for vendedor, full access for management.
-- ============================================================
alter table public.opportunities enable row level security;

create policy opportunities_select on public.opportunities
  for select to authenticated
  using (public.is_full_access() or owner_id = auth.uid());

create policy opportunities_insert on public.opportunities
  for insert to authenticated
  with check (public.is_full_access() or owner_id = auth.uid());

create policy opportunities_update on public.opportunities
  for update to authenticated
  using (public.is_full_access() or owner_id = auth.uid())
  with check (public.is_full_access() or owner_id = auth.uid());

create policy opportunities_delete on public.opportunities
  for delete to authenticated
  using (public.is_full_access() or owner_id = auth.uid());

-- ============================================================
-- activities — visible to the activity owner, the parent opportunity owner,
-- or full access.
-- ============================================================
alter table public.activities enable row level security;

create policy activities_select on public.activities
  for select to authenticated
  using (
    public.is_full_access()
    or owner_id = auth.uid()
    or public.owns_opportunity(opportunity_id)
  );

create policy activities_insert on public.activities
  for insert to authenticated
  with check (
    public.is_full_access()
    or owner_id = auth.uid()
    or public.owns_opportunity(opportunity_id)
  );

create policy activities_update on public.activities
  for update to authenticated
  using (
    public.is_full_access()
    or owner_id = auth.uid()
    or public.owns_opportunity(opportunity_id)
  )
  with check (
    public.is_full_access()
    or owner_id = auth.uid()
    or public.owns_opportunity(opportunity_id)
  );

create policy activities_delete on public.activities
  for delete to authenticated
  using (
    public.is_full_access()
    or owner_id = auth.uid()
    or public.owns_opportunity(opportunity_id)
  );
