-- Migration: campos de campaña (business_unit/fuente) + restringir Leads a roles de gestión
-- Sprint: post-deploy bug fix
--
-- Ventas deja de tener acceso a la sección Leads: la conversión a Oportunidad ahora es
-- automática al asignar un vendedor (ver app/(dashboard)/leads/actions.ts autoConvertLead),
-- así que el vendedor solo necesita ver /oportunidades, no /leads.
--
-- business_unit y fuente se definen a nivel de campaña (lead_sections) para que la
-- conversión automática no requiera un formulario adicional al momento de asignar.

alter table public.lead_sections
  add column business_unit public.business_unit not null default 'global_supplier_mty',
  add column fuente        public.lead_source    not null default 'otro';

-- DEUDA: las campañas creadas antes de esta migración quedan con el default de arriba.
-- Revisar/corregir desde "Editar campaña" antes de asignar vendedores en campañas viejas.

drop policy "leads_select" on public.leads;
create policy "leads_select" on public.leads
  for select to authenticated
  using (public.can_manage_leads());
