-- Migration: bandera it_staff en profiles — permite dar acceso de gestión de
-- tickets de TI a un perfil sin importar su rol principal (profiles.role es de
-- un solo valor, y alguien puede necesitar ser 'administracion' Y tener acceso
-- de soporte_ti al mismo tiempo, ej. aespino).
-- Sprint: post-deploy feature

alter table public.profiles add column it_staff boolean not null default false;

-- Reemplaza is_it_staff()/is_it_oversight() de 20260812130000_it_tickets_module.sql
-- para que también reconozcan la bandera, no solo el rol soporte_ti.
create or replace function public.is_it_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active and (role = 'soporte_ti' or it_staff)
  );
$$;

create or replace function public.is_it_oversight()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active
      and (role in ('soporte_ti', 'director_general', 'administracion') or it_staff)
  );
$$;

-- Extiende enforce_role_immutable() (20260629020000_fix_role_guard_allow_system.sql)
-- para que it_staff también sea un campo protegido, igual que role — sin esto,
-- profiles_update permite que cualquiera se auto-otorgue it_staff=true (la policy
-- es a nivel de fila, no de columna). Solo director_general o administracion
-- pueden tocarlo (el panel /admin/usuarios ya está gateado a administracion).
create or replace function public.enforce_role_immutable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not exists (
      select 1 from public.profiles
      where id       = auth.uid()
        and role     = 'director_general'
        and is_active = true
    ) then
      raise exception 'Only an active director_general can change a profile role';
    end if;
  end if;

  if new.it_staff is distinct from old.it_staff then
    if auth.uid() is not null and not exists (
      select 1 from public.profiles
      where id        = auth.uid()
        and role      in ('director_general', 'administracion')
        and is_active = true
    ) then
      raise exception 'Only an active director_general or administracion can change it_staff';
    end if;
  end if;

  return new;
end;
$$;
