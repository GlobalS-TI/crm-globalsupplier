-- Migration: agregar columna start_date a projects
-- Sprint: post-deploy bug fix
-- start_date existe en el Zod schema, la interfaz de repo, y el service,
-- pero se omitió en la migración original — toda creación de proyectos fallaba.

alter table public.projects
  add column start_date date;
