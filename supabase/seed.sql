-- Seed: development data — Sprint 0
-- Password for all users: LocalDev1234!
-- Run via: pnpm db:reset

-- ================================================================
-- Auth users (handle_new_user trigger auto-creates profiles)
-- ================================================================
do $$
declare
  pwd text := crypt('LocalDev1234!', gen_salt('bf', 10));
begin
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_user_meta_data, raw_app_meta_data, is_sso_user,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, reauthentication_token,
    phone_change, phone_change_token
  ) values
    ( '00000001-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'vpena@globalsupplier.com.mx', pwd, now(), now(), now(),
      '{"full_name":"Vladimir Peña","role":"director_general"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '', '', '', '', '' ),

    ( '00000002-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'karla.saucedo@thundersafetysolutions.com', pwd, now(), now(), now(),
      '{"full_name":"Karla Saucedo","role":"direccion_comercial"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '', '', '', '', '' ),

    -- ( '00000003-0000-0000-0000-000000000000',
    --   '00000000-0000-0000-0000-000000000000',
    --   'authenticated', 'authenticated',
    --   'analucia.garza@thundersafetysolutions.com', pwd, now(), now(), now(),
    --   '{"full_name":"Ana Lucía Garza","role":"vendedor"}',
    --   '{"provider":"email","providers":["email"]}', false,
    --   '', '', '', '', '', '', '', '' ),

    ( '00000004-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'angel.estrada@thunderledlights.mx', pwd, now(), now(), now(),
      '{"full_name":"Angel Estrada","role":"vendedor"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '', '', '', '', '' ),

    ( '00000005-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'rpena@thunderledlights.mx', pwd, now(), now(), now(),
      '{"full_name":"Rodolfo Peña","role":"vendedor"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '', '', '', '', '' ),

    ( '00000006-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'gdeleon@globalsupplier.com.mx', pwd, now(), now(), now(),
      '{"full_name":"Gerardo de León","role":"marketing"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '', '', '', '', '' ),

    ( '00000007-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'aespino@globalsupplier.com.mx', pwd, now(), now(), now(),
      '{"full_name":"Alexandro Espino","role":"administracion"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '', '', '', '', '' ),

    ( '00000008-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'erikagzzf@globalsupplier.com.mx', pwd, now(), now(), now(),
      '{"full_name":"Erika González","role":"vendedor"}',
      '{"provider":"email","providers":["email"]}', false,
      '', '', '', '', '', '', '', '' );
end $$;

-- ================================================================
-- Fix roles: handle_new_user() ahora siempre asigna 'vendedor' por
-- seguridad (no lee metadata). El seed los corrige explícitamente.
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
    'email', '00000001-0000-0000-0000-000000000000', now(), now(), now() ),

  ( 'a0000002-0000-0000-0000-000000000000',
    '00000002-0000-0000-0000-000000000000',
    '{"sub":"00000002-0000-0000-0000-000000000000","email":"karla.saucedo@thundersafetysolutions.com"}',
    'email', '00000002-0000-0000-0000-000000000000', now(), now(), now() ),

  ( 'a0000003-0000-0000-0000-000000000000',
    '00000003-0000-0000-0000-000000000000',
    '{"sub":"00000003-0000-0000-0000-000000000000","email":"analucia.garza@thundersafetysolutions.com"}',
    'email', '00000003-0000-0000-0000-000000000000', now(), now(), now() ),

  ( 'a0000004-0000-0000-0000-000000000000',
    '00000004-0000-0000-0000-000000000000',
    '{"sub":"00000004-0000-0000-0000-000000000000","email":"angel.estrada@thunderledlights.mx"}',
    'email', '00000004-0000-0000-0000-000000000000', now(), now(), now() ),

  ( 'a0000005-0000-0000-0000-000000000000',
    '00000005-0000-0000-0000-000000000000',
    '{"sub":"00000005-0000-0000-0000-000000000000","email":"rpena@thunderledlights.mx"}',
    'email', '00000005-0000-0000-0000-000000000000', now(), now(), now() ),

  ( 'a0000006-0000-0000-0000-000000000000',
    '00000006-0000-0000-0000-000000000000',
    '{"sub":"00000006-0000-0000-0000-000000000000","email":"gdeleon@globalsupplier.com.mx"}',
    'email', '00000006-0000-0000-0000-000000000000', now(), now(), now() ),

  ( 'a0000007-0000-0000-0000-000000000000',
    '00000007-0000-0000-0000-000000000000',
    '{"sub":"00000007-0000-0000-0000-000000000000","email":"aespino@globalsupplier.com.mx"}',
    'email', '00000007-0000-0000-0000-000000000000', now(), now(), now() ),

  ( 'a0000008-0000-0000-0000-000000000000',
    '00000008-0000-0000-0000-000000000000',
    '{"sub":"00000008-0000-0000-0000-000000000000","email":"erikagzzf@globalsupplier.com.mx"}',
    'email', '00000008-0000-0000-0000-000000000000', now(), now(), now() );

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
  ('00000008-0000-0000-0000-000000000000', 'juno_promotional');
