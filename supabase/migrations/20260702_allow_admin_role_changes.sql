-- Migration: allow_admin_role_changes
-- Sprint: 6
-- Razón: administracion (TI) necesita poder cambiar roles desde el panel de admin.
-- Se extiende la misma lógica que 20260629020000 (allow system / allow director).

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
        and role     in ('director_general', 'administracion')
        and is_active = true
    ) then
      raise exception 'Solo director_general o administracion pueden cambiar roles';
    end if;
  end if;
  return new;
end;
$$;
