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
    raw_user_meta_data, raw_app_meta_data, is_sso_user
  ) values
    ( '00000001-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'director@globalsupplier.dev', pwd, now(), now(), now(),
      '{"full_name":"Carlos Mendoza","role":"director_general"}',
      '{"provider":"email","providers":["email"]}', false ),

    ( '00000002-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'comercial@globalsupplier.dev', pwd, now(), now(), now(),
      '{"full_name":"Ana García","role":"direccion_comercial"}',
      '{"provider":"email","providers":["email"]}', false ),

    ( '00000003-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'r.herrera@globalsupplier.dev', pwd, now(), now(), now(),
      '{"full_name":"Roberto Herrera","role":"vendedor"}',
      '{"provider":"email","providers":["email"]}', false ),

    ( '00000004-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'l.sanchez@globalsupplier.dev', pwd, now(), now(), now(),
      '{"full_name":"Laura Sánchez","role":"vendedor"}',
      '{"provider":"email","providers":["email"]}', false ),

    ( '00000005-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'm.torres@globalsupplier.dev', pwd, now(), now(), now(),
      '{"full_name":"Miguel Torres","role":"vendedor"}',
      '{"provider":"email","providers":["email"]}', false ),

    ( '00000006-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'marketing@globalsupplier.dev', pwd, now(), now(), now(),
      '{"full_name":"Daniela López","role":"marketing"}',
      '{"provider":"email","providers":["email"]}', false ),

    ( '00000007-0000-0000-0000-000000000000',
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'admin@globalsupplier.dev', pwd, now(), now(), now(),
      '{"full_name":"Fernando Reyes","role":"administracion"}',
      '{"provider":"email","providers":["email"]}', false );
end $$;

-- ================================================================
-- Auth identities (required for email/password login via GoTrue)
-- ================================================================
insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at) values
  ( 'a0000001-0000-0000-0000-000000000000',
    '00000001-0000-0000-0000-000000000000',
    '{"sub":"00000001-0000-0000-0000-000000000000","email":"director@globalsupplier.dev"}',
    'email', '00000001-0000-0000-0000-000000000000', now(), now(), now() ),
  ( 'a0000002-0000-0000-0000-000000000000',
    '00000002-0000-0000-0000-000000000000',
    '{"sub":"00000002-0000-0000-0000-000000000000","email":"comercial@globalsupplier.dev"}',
    'email', '00000002-0000-0000-0000-000000000000', now(), now(), now() ),
  ( 'a0000003-0000-0000-0000-000000000000',
    '00000003-0000-0000-0000-000000000000',
    '{"sub":"00000003-0000-0000-0000-000000000000","email":"r.herrera@globalsupplier.dev"}',
    'email', '00000003-0000-0000-0000-000000000000', now(), now(), now() ),
  ( 'a0000004-0000-0000-0000-000000000000',
    '00000004-0000-0000-0000-000000000000',
    '{"sub":"00000004-0000-0000-0000-000000000000","email":"l.sanchez@globalsupplier.dev"}',
    'email', '00000004-0000-0000-0000-000000000000', now(), now(), now() ),
  ( 'a0000005-0000-0000-0000-000000000000',
    '00000005-0000-0000-0000-000000000000',
    '{"sub":"00000005-0000-0000-0000-000000000000","email":"m.torres@globalsupplier.dev"}',
    'email', '00000005-0000-0000-0000-000000000000', now(), now(), now() ),
  ( 'a0000006-0000-0000-0000-000000000000',
    '00000006-0000-0000-0000-000000000000',
    '{"sub":"00000006-0000-0000-0000-000000000000","email":"marketing@globalsupplier.dev"}',
    'email', '00000006-0000-0000-0000-000000000000', now(), now(), now() ),
  ( 'a0000007-0000-0000-0000-000000000000',
    '00000007-0000-0000-0000-000000000000',
    '{"sub":"00000007-0000-0000-0000-000000000000","email":"admin@globalsupplier.dev"}',
    'email', '00000007-0000-0000-0000-000000000000', now(), now(), now() );

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
  -- Roberto Herrera: MTY + GTX
  ('00000003-0000-0000-0000-000000000000', 'global_supplier_mty'),
  ('00000003-0000-0000-0000-000000000000', 'gtx_systems'),
  -- Laura Sánchez: thunder_safety
  ('00000004-0000-0000-0000-000000000000', 'thunder_safety'),
  -- Miguel Torres: thunder_led + got_fresh_breath (multi-unit)
  ('00000005-0000-0000-0000-000000000000', 'thunder_led'),
  ('00000005-0000-0000-0000-000000000000', 'got_fresh_breath'),
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
  ('00000007-0000-0000-0000-000000000000', 'fire_spot');

-- ================================================================
-- Companies
-- ================================================================
insert into public.companies (id, nombre, rfc, industria, ciudad, estado, owner_id) values
  ( 'c0000001-0000-0000-0000-000000000000',
    'Grupo Industrial Norteño',  'GIN010101ABC', 'Manufactura',
    'Monterrey', 'Nuevo León', '00000003-0000-0000-0000-000000000000' ),
  ( 'c0000002-0000-0000-0000-000000000000',
    'TechMex Solutions',         'TMS200301XYZ', 'Tecnología',
    'Monterrey', 'Nuevo León', '00000004-0000-0000-0000-000000000000' ),
  ( 'c0000003-0000-0000-0000-000000000000',
    'Distribuidora Sigma Norte', 'DSN150601QRS', 'Distribución',
    'Saltillo',  'Coahuila',   '00000005-0000-0000-0000-000000000000' );

-- ================================================================
-- Contacts
-- ================================================================
insert into public.contacts (id, company_id, nombre, apellido, puesto, email, telefono, owner_id) values
  ( 'd0000001-0000-0000-0000-000000000000',
    'c0000001-0000-0000-0000-000000000000',
    'Juan Pablo', 'Morales',  'Dir. Compras',      'jp.morales@gin.com.mx',   '81-1234-5678',
    '00000003-0000-0000-0000-000000000000' ),
  ( 'd0000002-0000-0000-0000-000000000000',
    'c0000001-0000-0000-0000-000000000000',
    'María Elena', 'Vega',   'Gte. Operaciones',   'me.vega@gin.com.mx',      '81-1234-5679',
    '00000003-0000-0000-0000-000000000000' ),
  ( 'd0000003-0000-0000-0000-000000000000',
    'c0000002-0000-0000-0000-000000000000',
    'Pedro',       'Ramírez', 'CTO',                'p.ramirez@techmex.com.mx','81-9876-5432',
    '00000004-0000-0000-0000-000000000000' ),
  ( 'd0000004-0000-0000-0000-000000000000',
    'c0000002-0000-0000-0000-000000000000',
    'Sofía',       'Castillo','Dir. Finanzas',      's.castillo@techmex.com.mx','81-9876-5433',
    '00000004-0000-0000-0000-000000000000' ),
  ( 'd0000005-0000-0000-0000-000000000000',
    'c0000003-0000-0000-0000-000000000000',
    'Ricardo',     'Núñez',  'Gerente General',    'r.nunez@sigmanorte.com.mx','84-4321-8765',
    '00000005-0000-0000-0000-000000000000' );

-- ================================================================
-- Opportunities (one per stage + extras for realistic dashboard)
-- Inserting with last_activity_at set manually; trigger handles stale via
-- mark_stale_opportunities(). For seed we set stale directly.
-- ================================================================
insert into public.opportunities (
  id, nombre, company_id, contact_id, owner_id,
  business_unit, etapa, fuente,
  monto_estimado, monto_final, probabilidad,
  fecha_cierre_estimada, last_activity_at, next_activity_at,
  stale, notas
) values
  -- 1. nuevo_lead — fresca
  ( 'e0000001-0000-0000-0000-000000000000',
    'Equipos de Seguridad Q3',
    'c0000002-0000-0000-0000-000000000000', 'd0000003-0000-0000-0000-000000000000',
    '00000004-0000-0000-0000-000000000000',
    'thunder_safety', 'nuevo_lead', 'linkedin',
    80000, null, 10,
    current_date + 60, now() - interval '1 day', now() + interval '2 days',
    false, 'Lead generado por campaña LinkedIn' ),

  -- 2. contactado — stale (sin actividad hace 12 días)
  ( 'e0000002-0000-0000-0000-000000000000',
    'Uniformes Industriales 2026',
    'c0000001-0000-0000-0000-000000000000', 'd0000001-0000-0000-0000-000000000000',
    '00000003-0000-0000-0000-000000000000',
    'global_supplier_mty', 'contactado', 'referido',
    120000, null, 20,
    current_date + 45, now() - interval '12 days', null,
    true, null ),

  -- 3. diagnostico — fresca
  ( 'e0000003-0000-0000-0000-000000000000',
    'Iluminación Planta Norte',
    'c0000003-0000-0000-0000-000000000000', 'd0000005-0000-0000-0000-000000000000',
    '00000005-0000-0000-0000-000000000000',
    'thunder_led', 'diagnostico', 'llamada_en_frio',
    350000, null, 35,
    current_date + 30, now() - interval '2 days', now() + interval '3 days',
    false, 'Requieren iluminación LED para 4 naves' ),

  -- 4. cotizacion_enviada — fresca
  ( 'e0000004-0000-0000-0000-000000000000',
    'Kit Prevención Incendio Almacén',
    'c0000002-0000-0000-0000-000000000000', 'd0000004-0000-0000-0000-000000000000',
    '00000004-0000-0000-0000-000000000000',
    'fire_spot', 'cotizacion_enviada', 'web',
    95000, null, 50,
    current_date + 20, now() - interval '3 days', now() + interval '5 days',
    false, 'Cotización enviada el lunes, pendiente respuesta' ),

  -- 5. seguimiento — stale (sin actividad hace 9 días)
  ( 'e0000005-0000-0000-0000-000000000000',
    'Productos Promocionales Q4',
    'c0000001-0000-0000-0000-000000000000', 'd0000002-0000-0000-0000-000000000000',
    '00000003-0000-0000-0000-000000000000',
    'juno_promotional', 'seguimiento', 'evento',
    45000, null, 40,
    current_date + 35, now() - interval '9 days', null,
    true, null ),

  -- 6. negociacion — alta probabilidad
  ( 'e0000006-0000-0000-0000-000000000000',
    'Snacks Corporativos Got Fresh Breath',
    'c0000003-0000-0000-0000-000000000000', 'd0000005-0000-0000-0000-000000000000',
    '00000005-0000-0000-0000-000000000000',
    'got_fresh_breath', 'negociacion', 'referido',
    180000, null, 75,
    current_date + 10, now() - interval '1 day', now() + interval '1 day',
    false, 'Cerramos precio, pendiente firma de contrato' ),

  -- 7. ganado — cerrado este mes
  ( 'e0000007-0000-0000-0000-000000000000',
    'Sistemas GTX Fase 1',
    'c0000001-0000-0000-0000-000000000000', 'd0000001-0000-0000-0000-000000000000',
    '00000003-0000-0000-0000-000000000000',
    'gtx_systems', 'ganado', 'alianza',
    220000, 215000, 100,
    current_date - 5, now() - interval '6 days', null,
    false, 'Firmado y facturado' ),

  -- 8. perdido
  ( 'e0000008-0000-0000-0000-000000000000',
    'Recarga Extintores Planta Sur',
    'c0000002-0000-0000-0000-000000000000', 'd0000003-0000-0000-0000-000000000000',
    '00000004-0000-0000-0000-000000000000',
    'thunder_safety', 'perdido', 'web',
    30000, null, 0,
    current_date - 15, now() - interval '20 days', null,
    false, 'Se fue con proveedor local por precio' );

-- ================================================================
-- Activities
-- ================================================================
insert into public.activities (
  id, opportunity_id, owner_id, tipo, estatus, titulo, descripcion, fecha, completed_at
) values
  -- Opp 1 (nuevo_lead) — llamada inicial
  ( 'f0000001-0000-0000-0000-000000000000',
    'e0000001-0000-0000-0000-000000000000', '00000004-0000-0000-0000-000000000000',
    'llamada', 'completada', 'Llamada de calificación',
    'Se confirmó interés, hay presupuesto aprobado para Q3.',
    now() - interval '1 day', now() - interval '1 day' ),

  -- Opp 1 — próxima reunión (pendiente)
  ( 'f0000002-0000-0000-0000-000000000000',
    'e0000001-0000-0000-0000-000000000000', '00000004-0000-0000-0000-000000000000',
    'reunion', 'pendiente', 'Reunión de diagnóstico',
    'Visita a sus instalaciones para evaluar necesidades.',
    now() + interval '2 days', null ),

  -- Opp 2 (contactado/stale) — último contacto fue hace 12 días
  ( 'f0000003-0000-0000-0000-000000000000',
    'e0000002-0000-0000-0000-000000000000', '00000003-0000-0000-0000-000000000000',
    'email', 'completada', 'Envío de catálogo',
    'Se mandó catálogo de uniformes industriales.',
    now() - interval '12 days', now() - interval '12 days' ),

  -- Opp 3 (diagnostico)
  ( 'f0000004-0000-0000-0000-000000000000',
    'e0000003-0000-0000-0000-000000000000', '00000005-0000-0000-0000-000000000000',
    'reunion', 'completada', 'Visita a planta',
    'Medición de naves y relevamiento eléctrico completados.',
    now() - interval '2 days', now() - interval '2 days' ),

  ( 'f0000005-0000-0000-0000-000000000000',
    'e0000003-0000-0000-0000-000000000000', '00000005-0000-0000-0000-000000000000',
    'propuesta', 'pendiente', 'Entrega de propuesta técnica',
    'Presentar propuesta LED + plan de instalación.',
    now() + interval '3 days', null ),

  -- Opp 4 (cotizacion_enviada) — email y seguimiento pendiente
  ( 'f0000006-0000-0000-0000-000000000000',
    'e0000004-0000-0000-0000-000000000000', '00000004-0000-0000-0000-000000000000',
    'email', 'completada', 'Cotización enviada',
    'Se mandó PDF con desglose de kit prevención.',
    now() - interval '3 days', now() - interval '3 days' ),

  ( 'f0000007-0000-0000-0000-000000000000',
    'e0000004-0000-0000-0000-000000000000', '00000004-0000-0000-0000-000000000000',
    'llamada', 'pendiente', 'Seguimiento cotización',
    'Confirmar recepción y resolver dudas de cotización.',
    now() + interval '5 days', null ),

  -- Opp 5 (seguimiento/stale) — hace 9 días, pendiente vencido
  ( 'f0000008-0000-0000-0000-000000000000',
    'e0000005-0000-0000-0000-000000000000', '00000003-0000-0000-0000-000000000000',
    'llamada', 'pendiente', 'Seguimiento post-evento',
    'Retomar contacto tras evento de la semana pasada.',
    now() - interval '9 days', null ),  -- overdue: pendiente y fecha pasada

  -- Opp 6 (negociacion) — demo completada, cierre pendiente
  ( 'f0000009-0000-0000-0000-000000000000',
    'e0000006-0000-0000-0000-000000000000', '00000005-0000-0000-0000-000000000000',
    'demo', 'completada', 'Demo de producto',
    'Excelente recepción. Confirman que cubre sus necesidades.',
    now() - interval '4 days', now() - interval '4 days' ),

  ( 'f0000010-0000-0000-0000-000000000000',
    'e0000006-0000-0000-0000-000000000000', '00000005-0000-0000-0000-000000000000',
    'seguimiento', 'pendiente', 'Revisión de contrato',
    'Última revisión legal antes de firma.',
    now() + interval '1 day', null ),

  -- Opp 7 (ganado) — historial cerrado
  ( 'f0000011-0000-0000-0000-000000000000',
    'e0000007-0000-0000-0000-000000000000', '00000003-0000-0000-0000-000000000000',
    'reunion', 'completada', 'Firma de contrato',
    'Contrato firmado. Se programa entrega para la siguiente semana.',
    now() - interval '6 days', now() - interval '6 days' ),

  -- Opp 8 (perdido) — historial
  ( 'f0000012-0000-0000-0000-000000000000',
    'e0000008-0000-0000-0000-000000000000', '00000004-0000-0000-0000-000000000000',
    'llamada', 'completada', 'Notificación de decisión',
    'Cliente eligió proveedor local. Dejar puerta abierta para futuro.',
    now() - interval '20 days', now() - interval '20 days' );
