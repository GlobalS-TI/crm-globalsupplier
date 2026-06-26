-- Migration: projects_add_start_date
-- Sprint: 6

alter table public.projects
  add column start_date date;
