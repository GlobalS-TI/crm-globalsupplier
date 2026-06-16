-- Migration: política de storage para documentos de oportunidades ganadas
-- Sprint: 8
-- Permite que cualquier usuario activo suba archivos al prefijo opportunity-docs/
-- El contenido del bucket media sigue restringido a content_managers para el resto

create policy "media_insert_opp_docs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and name like 'opportunity-docs/%'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_active
    )
  );
