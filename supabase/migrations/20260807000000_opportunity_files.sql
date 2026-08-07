-- Migration: panel de documentos por oportunidad (opportunity_files) + policy de delete en storage
-- Sprint: post-deploy feature

create table public.opportunity_files (
  id             uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  categoria      text not null default 'otro'
                   check (categoria in ('cotizacion', 'orden_compra', 'factura', 'otro')),
  file_path      text not null,
  nombre         text not null,
  mime_type      text,
  file_size      bigint,
  owner_id       uuid not null references public.profiles(id),
  created_at     timestamptz not null default now()
);

create index idx_opportunity_files_opportunity on public.opportunity_files(opportunity_id);

-- ============================================================
-- RLS — misma regla de acceso que la oportunidad dueña (owns_opportunity()
-- ya checa is_active del owner internamente). owner_id aquí es solo metadata
-- de auditoría (quién subió), no un input de la policy.
-- ============================================================
alter table public.opportunity_files enable row level security;

create policy opportunity_files_select on public.opportunity_files
  for select to authenticated
  using (public.is_full_access() or public.owns_opportunity(opportunity_id));

create policy opportunity_files_insert on public.opportunity_files
  for insert to authenticated
  with check (public.is_full_access() or public.owns_opportunity(opportunity_id));

create policy opportunity_files_delete on public.opportunity_files
  for delete to authenticated
  using (public.is_full_access() or public.owns_opportunity(opportunity_id));

-- ============================================================
-- Storage: falta política de DELETE para opportunity-docs/ — hoy solo existe
-- INSERT (20260616140000_storage_opp_docs_policy.sql). El SELECT ya está
-- cubierto bucket-wide por media_select. Sin esto, un vendedor no puede
-- borrar su propio archivo a nivel storage aunque la fila en
-- opportunity_files sí se deje borrar.
-- ============================================================
create policy "media_delete_opp_docs" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and name like 'opportunity-docs/%'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_active
    )
  );
