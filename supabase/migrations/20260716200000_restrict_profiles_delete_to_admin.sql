-- Migration: restringir DELETE de profiles a administracion
-- Sprint: post-deploy bug fix
--
-- profiles_delete usaba is_full_access() (director_general, direccion_comercial,
-- marketing, administracion), más permisivo que la página de admin que ya
-- restringe /admin/usuarios a role = 'administracion' (app/(dashboard)/admin/
-- layout.tsx). ADR-003: RLS es la única capa de permisos real, así que debe
-- coincidir con la restricción real de la UI que la usa (eliminar usuarios).

drop policy "profiles_delete" on public.profiles;

create policy "profiles_delete" on public.profiles
  for delete to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and is_active
        and role = 'administracion'
    )
  );
