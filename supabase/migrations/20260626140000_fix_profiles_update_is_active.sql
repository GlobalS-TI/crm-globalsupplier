-- Migration: profiles_update sin is_active en ramal id = auth.uid()
-- Sprint: post-deploy bug fix
--
-- Un usuario desactivado con JWT vivo podía editar su propia fila de
-- profiles (full_name, etc.) aunque is_full_access() lo bloqueara en
-- el resto de tablas. Consistencia con las correcciones anteriores.

drop policy profiles_update on public.profiles;

create policy profiles_update on public.profiles
  for update to authenticated
  using  (public.is_full_access() or (id = auth.uid() and public.is_active_owner()))
  with check (public.is_full_access() or (id = auth.uid() and public.is_active_owner()));
