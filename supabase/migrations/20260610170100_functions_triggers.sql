-- Migration: functions and triggers — updated_at, stale logic, auth sync, role guard
-- Sprint: 0

-- ============================================================
-- Generic updated_at maintenance
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_profiles_updated   before update on public.profiles      for each row execute function public.set_updated_at();
create trigger trg_companies_updated  before update on public.companies     for each row execute function public.set_updated_at();
create trigger trg_contacts_updated   before update on public.contacts      for each row execute function public.set_updated_at();
create trigger trg_opps_updated       before update on public.opportunities for each row execute function public.set_updated_at();
create trigger trg_activities_updated before update on public.activities    for each row execute function public.set_updated_at();

-- ============================================================
-- Provision a profile row when a new auth user is created.
-- full_name / role can be seeded from sign-up metadata; role defaults to vendedor.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'vendedor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Only director_general may change a profile's role (user administration).
-- Prevents privilege escalation: a user cannot promote themselves.
-- ============================================================
create or replace function public.enforce_role_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'director_general'
    ) then
      raise exception 'Only director_general can change a profile role';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_profiles_role_guard
  before update on public.profiles
  for each row execute function public.enforce_role_immutable();

-- ============================================================
-- Stale flag (ADR-002): a stored column, maintained by the DB, never computed at
-- query time. Two parts, because "no activity in > 7 days" depends on the passage
-- of time and a row trigger alone cannot observe that:
--   1. activity trigger        -> refresh last_activity_at + stale on activity change
--   2. mark_stale_opportunities -> daily sweep flips opps that crossed the 7-day line
-- ============================================================

-- Recompute last_activity_at (latest activity, or creation) and the stale flag.
create or replace function public.recompute_opportunity_stale(opp_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  latest timestamptz;
  current_stage public.opportunity_stage;
  created timestamptz;
begin
  select o.etapa, o.created_at into current_stage, created
  from public.opportunities o where o.id = opp_id;

  select max(a.fecha) into latest
  from public.activities a where a.opportunity_id = opp_id;

  latest := coalesce(latest, created);

  update public.opportunities
  set last_activity_at = latest,
      stale = case
        when current_stage in ('ganado', 'perdido') then false
        else latest < (now() - interval '7 days')
      end
  where id = opp_id;
end;
$$;

create or replace function public.touch_opportunity_from_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.recompute_opportunity_stale(coalesce(new.opportunity_id, old.opportunity_id));
  return coalesce(new, old);
end;
$$;

create trigger trg_activity_touch_opp
  after insert or update or delete on public.activities
  for each row execute function public.touch_opportunity_from_activity();

-- A closed opportunity is never stale — enforce it the moment it closes.
create or replace function public.sync_stale_on_close()
returns trigger
language plpgsql
as $$
begin
  if new.etapa in ('ganado', 'perdido') then
    new.stale := false;
  end if;
  return new;
end;
$$;

create trigger trg_opp_sync_stale
  before insert or update on public.opportunities
  for each row execute function public.sync_stale_on_close();

-- Daily sweep: flip open opportunities that have gone quiet for > 7 days.
create or replace function public.mark_stale_opportunities()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.opportunities
  set stale = true
  where etapa not in ('ganado', 'perdido')
    and stale = false
    and coalesce(last_activity_at, created_at) < (now() - interval '7 days');
  get diagnostics affected = row_count;
  return affected;
end;
$$;

-- Schedule the sweep via pg_cron when the extension is available (DB-level, not app
-- runtime — ADR-002). Resilient: if pg_cron is not preloaded (e.g. some local setups)
-- the function still exists and can be invoked by an external scheduler.
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule(
      'mark-stale-opportunities',
      '0 6 * * *',
      $cron$ select public.mark_stale_opportunities(); $cron$
    );
  else
    raise notice 'pg_cron not available — schedule mark_stale_opportunities() externally';
  end if;
exception when others then
  raise notice 'pg_cron scheduling skipped: %', sqlerrm;
end;
$$;
