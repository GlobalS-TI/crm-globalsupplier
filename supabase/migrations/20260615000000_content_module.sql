-- Migration: content module — categories, items, files, storage bucket, RLS
-- Sprint: 6
-- ADR-006: hybrid storage (Supabase Storage for uploads ≤200 MB, YouTube URL for large videos)

-- ============================================================
-- Helper: write access for content (marketing + director_general only)
-- ============================================================
create or replace function public.is_content_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and is_active
      and role in ('marketing', 'director_general')
  );
$$;

grant execute on function public.is_content_manager() to authenticated;

-- ============================================================
-- content_categories — managed by marketing / director_general
-- ============================================================
create table public.content_categories (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  icono      text,
  orden      smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- content_items — one row per product/asset, belongs to a category + brand
-- ============================================================
create table public.content_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.content_categories(id) on delete cascade,
  business_unit public.business_unit not null,
  nombre        text not null,
  descripcion   text,
  owner_id      uuid not null references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- content_files — actual files or YouTube URLs attached to an item
-- ============================================================
create table public.content_files (
  id         uuid primary key default gen_random_uuid(),
  item_id    uuid not null references public.content_items(id) on delete cascade,
  tipo       text not null check (tipo in ('upload', 'youtube_url')),
  file_path  text,   -- Supabase Storage path  (tipo = 'upload')
  url        text,   -- external URL            (tipo = 'youtube_url')
  nombre     text not null,
  mime_type  text,
  file_size  bigint,
  owner_id   uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  -- Ensure each tipo has the right pointer
  constraint cf_upload_needs_path   check (tipo <> 'upload'      or file_path is not null),
  constraint cf_youtube_needs_url   check (tipo <> 'youtube_url' or url is not null)
);

-- ============================================================
-- Indexes
-- ============================================================
create index idx_content_items_category   on public.content_items (category_id);
create index idx_content_items_unit       on public.content_items (business_unit);
create index idx_content_files_item       on public.content_files (item_id);

-- ============================================================
-- updated_at triggers (reuse existing function set_updated_at)
-- ============================================================
create trigger trg_content_categories_updated
  before update on public.content_categories
  for each row execute function public.set_updated_at();

create trigger trg_content_items_updated
  before update on public.content_items
  for each row execute function public.set_updated_at();

-- ============================================================
-- Grants
-- ============================================================
grant select, insert, update, delete
  on public.content_categories, public.content_items, public.content_files
  to authenticated, service_role;

-- ============================================================
-- RLS — content_categories
-- All authenticated can read; only content managers can write.
-- ============================================================
alter table public.content_categories enable row level security;

create policy cc_select on public.content_categories
  for select to authenticated using (true);

create policy cc_insert on public.content_categories
  for insert to authenticated with check (public.is_content_manager());

create policy cc_update on public.content_categories
  for update to authenticated
  using (public.is_content_manager()) with check (public.is_content_manager());

create policy cc_delete on public.content_categories
  for delete to authenticated using (public.is_content_manager());

-- ============================================================
-- RLS — content_items
-- ============================================================
alter table public.content_items enable row level security;

create policy ci_select on public.content_items
  for select to authenticated using (true);

create policy ci_insert on public.content_items
  for insert to authenticated with check (public.is_content_manager());

create policy ci_update on public.content_items
  for update to authenticated
  using (public.is_content_manager()) with check (public.is_content_manager());

create policy ci_delete on public.content_items
  for delete to authenticated using (public.is_content_manager());

-- ============================================================
-- RLS — content_files
-- ============================================================
alter table public.content_files enable row level security;

create policy cf_select on public.content_files
  for select to authenticated using (true);

create policy cf_insert on public.content_files
  for insert to authenticated with check (public.is_content_manager());

create policy cf_update on public.content_files
  for update to authenticated
  using (public.is_content_manager()) with check (public.is_content_manager());

create policy cf_delete on public.content_files
  for delete to authenticated using (public.is_content_manager());

-- ============================================================
-- Supabase Storage — bucket `media` (private, 200 MB limit)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  false,
  209715200,  -- 200 MB
  array[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do nothing;

-- Storage RLS (storage.objects already has RLS enabled by default in Supabase)
create policy "media_select"
  on storage.objects for select to authenticated
  using (bucket_id = 'media');

create policy "media_insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_content_manager());

create policy "media_update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_content_manager());

create policy "media_delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_content_manager());

-- ============================================================
-- Seed: default categories (editable/deletable from UI)
-- Fixed UUIDs so db:reset produces stable references.
-- ============================================================
insert into public.content_categories (id, nombre, icono, orden) values
  ('cc000001-0000-0000-0000-000000000000', 'Brochures',                 'FileText',       1),
  ('cc000002-0000-0000-0000-000000000000', 'Catálogos',                 'BookOpen',       2),
  ('cc000003-0000-0000-0000-000000000000', 'Fichas Técnicas',           'ClipboardList',  3),
  ('cc000004-0000-0000-0000-000000000000', 'Videos',                    'Video',          4),
  ('cc000005-0000-0000-0000-000000000000', 'Manuales',                  'Book',           5),
  ('cc000006-0000-0000-0000-000000000000', 'Presentaciones',            'Presentation',   6),
  ('cc000007-0000-0000-0000-000000000000', 'Folder',                    'Folder',         7),
  ('cc000008-0000-0000-0000-000000000000', 'Logos',                     'Image',          8),
  ('cc000009-0000-0000-0000-000000000000', 'Firmas Electrónicas',       'PenLine',        9),
  ('cc000010-0000-0000-0000-000000000000', 'CV Empresarial',            'Briefcase',     10),
  ('cc000011-0000-0000-0000-000000000000', 'Trípticos 2025',            'LayoutTemplate', 11),
  ('cc000012-0000-0000-0000-000000000000', 'Documentación Empresarial', 'FolderOpen',    12);
