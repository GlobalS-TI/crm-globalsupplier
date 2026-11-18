import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/server'
import { LeadSectionRepository, LeadRepository } from '@/lib/repositories/supabase/LeadRepository'
import { ProfileRepository } from '@/lib/repositories/supabase/ProfileRepository'
import { LeadService } from '@/lib/services/LeadService'
import { BRAND_LABELS, LEAD_SOURCE_LABELS, LEADS_EXPORT_ROLES } from '@/lib/types'
import type { UserRole } from '@/lib/types'
import { formatBusinessDateTime } from '@/lib/utils/date'
import type { LeadWithRelations } from '@/lib/repositories/interfaces/ILeadRepository'

export const dynamic = 'force-dynamic'

// Orden de columnas = orden del encabezado en Excel.
function toExportRecord(lead: LeadWithRelations) {
  return {
    'Campaña':                   lead.section.nombre,
    'Unidad de negocio':         BRAND_LABELS[lead.section.business_unit],
    'Origen':                    LEAD_SOURCE_LABELS[lead.section.fuente],
    'Nombre':                    lead.nombre,
    'Empresa':                   lead.empresa ?? '',
    'Numero de contacto':        lead.telefono ?? '',
    'Correo electronico':        lead.email ?? '',
    'Requerimientos':            lead.requerimientos ?? '',
    'Archivo de requerimientos': lead.requirements_file_path ? 'Sí' : 'No',
    'Responsable':               lead.responsable?.full_name ?? '',
    'Vendedor':                  lead.vendedor?.full_name ?? '',
    'Convertido a oportunidad':  lead.converted_opportunity_id ? 'Sí' : 'No',
    'Fecha de creación':         formatBusinessDateTime(lead.created_at),
    'Última actualización':      formatBusinessDateTime(lead.updated_at),
  }
}

const COLUMN_WIDTHS = [28, 22, 16, 28, 24, 20, 28, 40, 12, 22, 22, 12, 17, 17]

// Todas las campañas en un solo Excel. Se genera en servidor (no en el navegador como
// el export por campaña) porque la página no carga los leads de todas las secciones, y
// el .xlsx comprimido pesa mucho menos que mandar las filas como JSON al cliente.
// El gate por rol es UX/defensa en profundidad — RLS (can_manage_leads) es la seguridad real (ADR-003).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('No autenticado', { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!LEADS_EXPORT_ROLES.includes((profile?.role ?? '') as UserRole)) {
    return new Response('Sin permiso', { status: 403 })
  }

  const svc   = new LeadService(new LeadSectionRepository(), new LeadRepository(), new ProfileRepository())
  const leads = await svc.listAllLeads()

  const sheet    = XLSX.utils.json_to_sheet(leads.map(toExportRecord))
  sheet['!cols'] = COLUMN_WIDTHS.map(wch => ({ wch }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'Leads')
  const file: Buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', compression: true })

  return new Response(new Uint8Array(file), {
    headers: {
      'Content-Type':  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Cache-Control': 'no-store',
    },
  })
}
