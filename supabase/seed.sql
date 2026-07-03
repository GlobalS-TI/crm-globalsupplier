-- Seed: development data — Sprint 0
-- Password for all users: LocalDev1234!
-- Run via: pnpm db:reset

-- ================================================================
-- Auth users (handle_new_user trigger auto-creates profiles)
-- Columnas mínimas para ser compatibles con todas las versiones
-- del Supabase local stack.
-- ================================================================
do $$
declare
  pwd text := crypt('LocalDev1234!', gen_salt('bf', 10));
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_sso_user,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values
    ( '00000001-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'vpena@globalsupplier.com.mx', pwd, now(), now(), now(),
      '{"full_name":"Vladimir Peña"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '' ),

    ( '00000002-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'karla.saucedo@thundersafetysolutions.com', pwd, now(), now(), now(),
      '{"full_name":"Karla Saucedo"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '' ),

    ( '00000003-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'analucia.garza@thundersafetysolutions.com', pwd, now(), now(), now(),
      '{"full_name":"Ana Lucía Garza"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '' ),

    ( '00000004-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'angel.estrada@thunderledlights.mx', pwd, now(), now(), now(),
      '{"full_name":"Angel Estrada"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '' ),

    ( '00000005-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'rpena@thunderledlights.mx', pwd, now(), now(), now(),
      '{"full_name":"Rodolfo Peña"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '' ),

    ( '00000006-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'gdeleon@globalsupplier.com.mx', pwd, now(), now(), now(),
      '{"full_name":"Gerardo de León"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '' ),

    ( '00000007-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'aespino@globalsupplier.com.mx', pwd, now(), now(), now(),
      '{"full_name":"Alexandro Espino"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '' ),

    ( '00000008-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'erikagzzf@globalsupplier.com.mx', pwd, now(), now(), now(),
      '{"full_name":"Erika González"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '' )

  on conflict (id) do nothing;
end $$;

-- ================================================================
-- Fix roles: handle_new_user() siempre asigna 'vendedor' por
-- seguridad. El seed los corrige explícitamente.
-- ================================================================
update public.profiles set role = 'director_general'    where id = '00000001-0000-0000-0000-000000000000';
update public.profiles set role = 'direccion_comercial' where id = '00000002-0000-0000-0000-000000000000';
update public.profiles set role = 'marketing'           where id = '00000006-0000-0000-0000-000000000000';
update public.profiles set role = 'administracion'      where id = '00000007-0000-0000-0000-000000000000';
-- usuarios 3, 4, 5, 8 ya son vendedor — sin cambio necesario

-- ================================================================
-- Auth identities (required for email/password login via GoTrue)
-- ================================================================
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) values
  ( 'a0000001-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000000',
    '{"sub":"00000001-0000-0000-0000-000000000000","email":"vpena@globalsupplier.com.mx"}',
    'email', 'vpena@globalsupplier.com.mx', now(), now(), now() ),

  ( 'a0000002-0000-0000-0000-000000000000',
    '00000002-0000-0000-0000-000000000000',
    '{"sub":"00000002-0000-0000-0000-000000000000","email":"karla.saucedo@thundersafetysolutions.com"}',
    'email', 'karla.saucedo@thundersafetysolutions.com', now(), now(), now() ),

  ( 'a0000003-0000-0000-0000-000000000000',
    '00000003-0000-0000-0000-000000000000',
    '{"sub":"00000003-0000-0000-0000-000000000000","email":"analucia.garza@thundersafetysolutions.com"}',
    'email', 'analucia.garza@thundersafetysolutions.com', now(), now(), now() ),

  ( 'a0000004-0000-0000-0000-000000000000',
    '00000004-0000-0000-0000-000000000000',
    '{"sub":"00000004-0000-0000-0000-000000000000","email":"angel.estrada@thunderledlights.mx"}',
    'email', 'angel.estrada@thunderledlights.mx', now(), now(), now() ),

  ( 'a0000005-0000-0000-0000-000000000000',
    '00000005-0000-0000-0000-000000000000',
    '{"sub":"00000005-0000-0000-0000-000000000000","email":"rpena@thunderledlights.mx"}',
    'email', 'rpena@thunderledlights.mx', now(), now(), now() ),

  ( 'a0000006-0000-0000-0000-000000000000',
    '00000006-0000-0000-0000-000000000000',
    '{"sub":"00000006-0000-0000-0000-000000000000","email":"gdeleon@globalsupplier.com.mx"}',
    'email', 'gdeleon@globalsupplier.com.mx', now(), now(), now() ),

  ( 'a0000007-0000-0000-0000-000000000000',
    '00000007-0000-0000-0000-000000000000',
    '{"sub":"00000007-0000-0000-0000-000000000000","email":"aespino@globalsupplier.com.mx"}',
    'email', 'aespino@globalsupplier.com.mx', now(), now(), now() ),

  ( 'a0000008-0000-0000-0000-000000000000',
    '00000008-0000-0000-0000-000000000000',
    '{"sub":"00000008-0000-0000-0000-000000000000","email":"erikagzzf@globalsupplier.com.mx"}',
    'email', 'erikagzzf@globalsupplier.com.mx', now(), now(), now() )

on conflict (id) do nothing;

-- ================================================================
-- Business unit memberships (profiles already exist via trigger)
-- ================================================================
insert into public.profile_business_units (profile_id, business_unit) values
  -- director_general: todas las unidades
  ('00000001-0000-0000-0000-000000000000', 'global_supplier_mty'),
  ('00000001-0000-0000-0000-000000000000', 'thunder_safety'),
  ('00000001-0000-0000-0000-000000000000', 'thunder_led'),
  ('00000001-0000-0000-0000-000000000000', 'got_fresh_breath'),
  ('00000001-0000-0000-0000-000000000000', 'gtx_systems'),
  ('00000001-0000-0000-0000-000000000000', 'juno_promotional'),
  ('00000001-0000-0000-0000-000000000000', 'fire_spot'),
  -- direccion_comercial: todas
  ('00000002-0000-0000-0000-000000000000', 'global_supplier_mty'),
  ('00000002-0000-0000-0000-000000000000', 'thunder_safety'),
  ('00000002-0000-0000-0000-000000000000', 'thunder_led'),
  ('00000002-0000-0000-0000-000000000000', 'got_fresh_breath'),
  ('00000002-0000-0000-0000-000000000000', 'gtx_systems'),
  ('00000002-0000-0000-0000-000000000000', 'juno_promotional'),
  ('00000002-0000-0000-0000-000000000000', 'fire_spot'),
  -- Ana Lucía Garza: thunder_safety + thunder_led
  ('00000003-0000-0000-0000-000000000000', 'thunder_safety'),
  ('00000003-0000-0000-0000-000000000000', 'thunder_led'),
  -- Angel Estrada: thunder_led
  ('00000004-0000-0000-0000-000000000000', 'thunder_led'),
  -- Rodolfo Peña: global_supplier_mty
  ('00000005-0000-0000-0000-000000000000', 'global_supplier_mty'),
  -- marketing: todas
  ('00000006-0000-0000-0000-000000000000', 'global_supplier_mty'),
  ('00000006-0000-0000-0000-000000000000', 'thunder_safety'),
  ('00000006-0000-0000-0000-000000000000', 'thunder_led'),
  ('00000006-0000-0000-0000-000000000000', 'got_fresh_breath'),
  ('00000006-0000-0000-0000-000000000000', 'gtx_systems'),
  ('00000006-0000-0000-0000-000000000000', 'juno_promotional'),
  ('00000006-0000-0000-0000-000000000000', 'fire_spot'),
  -- administracion: todas
  ('00000007-0000-0000-0000-000000000000', 'global_supplier_mty'),
  ('00000007-0000-0000-0000-000000000000', 'thunder_safety'),
  ('00000007-0000-0000-0000-000000000000', 'thunder_led'),
  ('00000007-0000-0000-0000-000000000000', 'got_fresh_breath'),
  ('00000007-0000-0000-0000-000000000000', 'gtx_systems'),
  ('00000007-0000-0000-0000-000000000000', 'juno_promotional'),
  ('00000007-0000-0000-0000-000000000000', 'fire_spot'),
  -- Erika González: juno_promotional
  ('00000008-0000-0000-0000-000000000000', 'juno_promotional')

on conflict (profile_id, business_unit) do nothing;
