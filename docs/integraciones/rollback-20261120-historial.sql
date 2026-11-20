-- Reversión de 20261120120000_integration_historial_valken.sql (SQL editor, rol postgres).
-- Deja la API de integración exactamente como antes: las funciones de escritura recuperan su
-- nombre original y sus grants; desaparecen el historial, el switch nuevo y can_write.
-- Antes de correrlo: revocar la key de VÄLKEN (integration_revoke_key) para que no reciba 500.
begin;

do $$
declare
  fn regprocedure;
begin
  for fn in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname like 'integration\_history\_%'
        or p.proname in ('integration_require_write', 'integration_set_read_permissions',
                         'integration_create_company', 'integration_create_contact', 'integration_create_opportunity',
                         'integration_update_opportunity', 'integration_create_activity', 'integration_update_activity'))
  loop
    execute format('drop function %s', fn);
  end loop;
end;
$$;

alter function public.integration_create_company_impl(text, jsonb)           rename to integration_create_company;
alter function public.integration_create_contact_impl(text, jsonb)           rename to integration_create_contact;
alter function public.integration_create_opportunity_impl(text, jsonb)       rename to integration_create_opportunity;
alter function public.integration_update_opportunity_impl(text, uuid, jsonb) rename to integration_update_opportunity;
alter function public.integration_create_activity_impl(text, jsonb)          rename to integration_create_activity;
alter function public.integration_update_activity_impl(text, uuid, jsonb)    rename to integration_update_activity;

grant execute on function public.integration_create_company(text, jsonb)           to service_role;
grant execute on function public.integration_create_contact(text, jsonb)           to service_role;
grant execute on function public.integration_create_opportunity(text, jsonb)       to service_role;
grant execute on function public.integration_update_opportunity(text, uuid, jsonb) to service_role;
grant execute on function public.integration_create_activity(text, jsonb)          to service_role;
grant execute on function public.integration_update_activity(text, uuid, jsonb)    to service_role;

alter table public.integration_clients
  drop column can_write,
  drop column can_read_history;

delete from supabase_migrations.schema_migrations where version = '20261120120000';

commit;
