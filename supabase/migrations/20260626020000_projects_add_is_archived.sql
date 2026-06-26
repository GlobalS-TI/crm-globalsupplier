-- Migration: projects_add_is_archived
-- Sprint: 6

alter table public.projects
  add column if not exists is_archived boolean not null default false;

create index if not exists projects_is_archived_idx on public.projects (is_archived);
