-- Migration: fix_role_guard_allow_system
-- Sprint: 6
-- Razón: enforce_role_immutable bloqueaba cambios de rol cuando auth.uid()
-- es NULL (seeds, migraciones, service_role). El guard solo aplica a
-- requests autenticados de usuarios finales.

create or replace function public.enforce_role_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- Permitir si no hay sesión autenticada (seed, migración, service_role)
    if auth.uid() is not null and not exists (
      select 1 from public.profiles
      where id       = auth.uid()
        and role     = 'director_general'
        and is_active = true
    ) then
      raise exception 'Only an active director_general can change a profile role';
    end if;
  end if;
  return new;
end;
$$;
