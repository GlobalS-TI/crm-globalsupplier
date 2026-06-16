-- Migration: leads — columnas responsable_id y vendedor_id
-- Sprint: 8
-- Reemplaza assigned_to (vendedor) con nomenclatura explícita y agrega
-- responsable_id que siempre apunta al perfil con rol direccion_comercial.

-- 1. Renombrar assigned_to → vendedor_id
alter table public.leads rename column assigned_to to vendedor_id;

-- 2. Agregar responsable_id
alter table public.leads add column responsable_id uuid references public.profiles(id);

-- 3. Backfill: asignar el responsable_id al usuario actual con direccion_comercial
update public.leads
set responsable_id = (
  select id from public.profiles
  where role = 'direccion_comercial' and is_active = true
  limit 1
);

-- 4. Índices
drop index if exists leads_assigned_to_idx;
create index leads_vendedor_id_idx    on public.leads (vendedor_id);
create index leads_responsable_id_idx on public.leads (responsable_id);

-- 5. Actualizar política de SELECT para usar vendedor_id
drop policy if exists "leads_select" on public.leads;
create policy "leads_select"
  on public.leads for select to authenticated
  using (
    public.can_manage_leads()
    or vendedor_id = auth.uid()
  );
