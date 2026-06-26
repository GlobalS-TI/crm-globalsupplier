-- Migration: project_updates_table
-- Sprint: 6

create table public.project_updates (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid not null references public.projects(id) on delete cascade,
  content    text not null,
  file_url   text,
  file_label text,
  author_id  uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

create index on public.project_updates (project_id, created_at);
