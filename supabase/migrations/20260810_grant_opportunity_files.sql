-- Migration: grant_opportunity_files
-- Sprint: 6
-- Razón: opportunity_files se creó en 20260807000000_opportunity_files.sql
-- después del snapshot de grants en 20260622213753_init_schema.sql.
-- Con auto_expose_new_tables=false quedó sin grants, bloqueando a
-- `authenticated` con "permission denied for table opportunity_files"
-- (mismo bug ya visto en opportunity_costs, project_updates y notifications).

grant select, insert, update, delete
  on public.opportunity_files
  to authenticated, service_role;
