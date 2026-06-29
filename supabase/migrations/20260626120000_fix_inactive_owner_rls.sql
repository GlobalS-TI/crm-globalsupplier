-- Migration: bloquear acceso RLS a usuarios desactivados en el ramal owner
-- Sprint: post-deploy bug fix
--
-- is_full_access() ya verifica is_active. Pero las políticas owner-scoped
-- usaban `owner_id = auth.uid()` sin verificar is_active, permitiendo a un
-- vendedor desactivado operar hasta que expirara su JWT (~1h).
-- ADR-003: RLS es la única capa de permisos — el check de is_active en layout
-- no es suficiente.

create or replace function public.is_active_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$;

grant execute on function public.is_active_owner() to authenticated;

-- ── companies ────────────────────────────────────────────────────

drop policy companies_select on public.companies;
drop policy companies_insert on public.companies;
drop policy companies_update on public.companies;
drop policy companies_delete on public.companies;

create policy companies_select on public.companies
  for select to authenticated
  using (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy companies_insert on public.companies
  for insert to authenticated
  with check (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy companies_update on public.companies
  for update to authenticated
  using  (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()))
  with check (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy companies_delete on public.companies
  for delete to authenticated
  using (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

-- ── contacts ────────────────────────────────────────────────────

drop policy contacts_select on public.contacts;
drop policy contacts_insert on public.contacts;
drop policy contacts_update on public.contacts;
drop policy contacts_delete on public.contacts;

create policy contacts_select on public.contacts
  for select to authenticated
  using (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy contacts_insert on public.contacts
  for insert to authenticated
  with check (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy contacts_update on public.contacts
  for update to authenticated
  using  (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()))
  with check (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy contacts_delete on public.contacts
  for delete to authenticated
  using (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

-- ── opportunities ────────────────────────────────────────────────

drop policy opportunities_select on public.opportunities;
drop policy opportunities_insert on public.opportunities;
drop policy opportunities_update on public.opportunities;
drop policy opportunities_delete on public.opportunities;

create policy opportunities_select on public.opportunities
  for select to authenticated
  using (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy opportunities_insert on public.opportunities
  for insert to authenticated
  with check (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy opportunities_update on public.opportunities
  for update to authenticated
  using  (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()))
  with check (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));

create policy opportunities_delete on public.opportunities
  for delete to authenticated
  using (public.is_full_access() or (owner_id = auth.uid() and public.is_active_owner()));
