-- Migration: grant_missing_tables
-- Sprint: 6
-- Razón: opportunity_costs y project_updates fueron creadas después de
-- 20260622213753_init_schema.sql (que capturaba los grants existentes).
-- Con auto_expose_new_tables=false estas tablas quedaron sin grants,
-- bloqueando al rol `authenticated` con "permission denied".

grant select, insert, update, delete
  on public.opportunity_costs
  to authenticated, service_role;

grant select, insert, update, delete
  on public.project_updates
  to authenticated, service_role;
