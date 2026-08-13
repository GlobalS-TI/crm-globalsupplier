'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { LeadSectionRepository, LeadRepository } from '@/lib/repositories/supabase/LeadRepository'
import { ProfileRepository } from '@/lib/repositories/supabase/ProfileRepository'
import { LeadService } from '@/lib/services/LeadService'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { OpportunityFileRepository } from '@/lib/repositories/supabase/OpportunityFileRepository'
import { OpportunityFileService } from '@/lib/services/OpportunityFileService'
import { CompanyRepository } from '@/lib/repositories/supabase/CompanyRepository'
import { CompanyService } from '@/lib/services/CompanyService'
import { ContactRepository } from '@/lib/repositories/supabase/ContactRepository'
import { ContactService } from '@/lib/services/ContactService'
import { createContactSchema } from '@/lib/validations/contact'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyLeadConverted, notifyOpportunityAssigned, getManagementProfileIds } from '@/lib/notifications/send'
import type { LeadWithRelations } from '@/lib/repositories/interfaces/ILeadRepository'
import type { BusinessUnit, LeadSource } from '@/lib/types'

type ActionState = { error: string } | null

function service() {
  return new LeadService(new LeadSectionRepository(), new LeadRepository(), new ProfileRepository())
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user
}

async function getFullName(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single()
  return data?.full_name ?? ''
}

function parseVendedor(form: FormData): string | undefined | null {
  const v = form.get('vendedor_id') as string
  if (!v || v === '__none__') return undefined
  return v
}

/**
 * Resuelve (o crea) la Company/Contact correspondientes a los datos de contacto de un
 * lead, para que no se pierdan al convertir a oportunidad. Busca por coincidencia exacta
 * antes de crear, para no duplicar empresas/contactos ya existentes.
 *
 * Un email con formato inválido (p.ej. datos de una importación con columnas swapeadas)
 * no debe tronar toda la conversión — se omite la creación del contacto en ese caso y
 * la oportunidad se crea igual, solo sin ese vínculo.
 */
async function resolveCompanyContact(opts: {
  lead:    Pick<LeadWithRelations, 'nombre' | 'empresa' | 'email' | 'telefono'>
  ownerId: string
}): Promise<{ company_id?: string; contact_id?: string }> {
  const { lead, ownerId } = opts
  const companySvc = new CompanyService(new CompanyRepository())
  const contactSvc = new ContactService(new ContactRepository())

  let company_id: string | undefined
  if (lead.empresa) {
    const matches  = await companySvc.list(lead.empresa)
    const existing = matches.find(c => c.nombre.toLowerCase() === lead.empresa!.toLowerCase())
    company_id = existing
      ? existing.id
      : (await companySvc.create({ nombre: lead.empresa }, ownerId)).id
  }

  let contact_id: string | undefined
  if (lead.email && createContactSchema.shape.email.safeParse(lead.email).success) {
    const existing = await contactSvc.findByEmail(lead.email)
    contact_id = existing
      ? existing.id
      : (await contactSvc.create({
          nombre:     lead.nombre,
          email:      lead.email,
          telefono:   lead.telefono ?? undefined,
          company_id,
        }, ownerId)).id
  }

  return { company_id, contact_id }
}

/**
 * Copia el archivo de requerimientos del lead (bucket 'media', prefijo leads/) al
 * panel de Documentos de la oportunidad recién creada, para que no se pierda al
 * convertir. Best-effort: un fallo aquí no debe tronar la conversión.
 */
async function carryOverRequirementFile(
  lead:    Pick<LeadWithRelations, 'requirements_file_path' | 'nombre'>,
  oppId:   string,
  ownerId: string,
): Promise<void> {
  if (!lead.requirements_file_path) return

  try {
    const basename = lead.requirements_file_path.split('/').pop() ?? 'requerimiento'
    const newPath  = `opportunity-docs/${oppId}/${Date.now()}-${basename}`

    const { error: copyErr } = await supabaseAdmin.storage
      .from('media')
      .copy(lead.requirements_file_path, newPath)
    if (copyErr) return

    await new OpportunityFileService(new OpportunityFileRepository()).addFile({
      opportunity_id: oppId,
      categoria:      'otro',
      nombre:         basename,
      file_path:      newPath,
    }, ownerId)
  } catch { /* best-effort: no bloquea la conversión */ }
}

/**
 * Al asignar un vendedor a un lead se crea automáticamente la oportunidad correspondiente
 * (business_unit/fuente vienen de la campaña) — ventas ya no necesita acceso a /leads.
 * Idempotente: no-op si el lead no tiene vendedor o ya fue convertido.
 */
async function autoConvertLead(lead: LeadWithRelations, assignedByName: string): Promise<void> {
  if (!lead.vendedor_id || lead.converted_opportunity_id) return

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const { company_id, contact_id } = await resolveCompanyContact({ lead, ownerId: lead.vendedor_id })

  const oppService = new OpportunityService(new OpportunityRepository())
  const opp = await oppService.create({
    nombre:           lead.empresa ? `${lead.empresa} — ${lead.nombre}` : lead.nombre,
    business_unit:    lead.section.business_unit,
    fuente:           lead.section.fuente,
    owner_id:         lead.vendedor_id,
    etapa:            'nuevo_lead',
    next_activity_at: tomorrow.toISOString(),
    notas:            lead.requerimientos || undefined,
    company_id,
    contact_id,
  })

  await service().updateLead(lead.id, { converted_opportunity_id: opp.id })
  await carryOverRequirementFile(lead, opp.id, lead.vendedor_id)
  revalidatePath('/oportunidades')

  // after(): un `void promise` fire-and-forget no garantiza completarse — Vercel puede
  // congelar la función serverless en cuanto se envía la respuesta del Server Action,
  // matando el envío a medias. after() sí espera a que termine antes de cerrar.
  const vendedorId = lead.vendedor_id
  after(() =>
    notifyOpportunityAssigned({
      recipientId:    vendedorId,
      oppId:          opp.id,
      oppNombre:      opp.nombre,
      leadName:       lead.nombre,
      assignedByName,
    }).catch(() => { /* notificaciones no bloquean */ })
  )
}

// ── Sections ──────────────────────────────────────────────────────

export async function createSection(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await getUser()
    const section = await service().createSection({
      nombre:        form.get('nombre') as string,
      descripcion:   (form.get('descripcion') as string) || undefined,
      business_unit: form.get('business_unit') as BusinessUnit,
      fuente:        form.get('fuente') as LeadSource,
    }, user.id)
    revalidatePath('/leads')
    redirect(`/leads?sec=${section.id}`)
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e
    return { error: (e as Error).message }
  }
}

export async function updateSection(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await service().updateSection(id, {
      nombre:        form.get('nombre') as string,
      descripcion:   (form.get('descripcion') as string) || undefined,
      business_unit: form.get('business_unit') as BusinessUnit,
      fuente:        form.get('fuente') as LeadSource,
    })
    revalidatePath('/leads')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteSection(id: string): Promise<void> {
  await service().deleteSection(id)
  revalidatePath('/leads')
  redirect('/leads')
}

// ── Leads ─────────────────────────────────────────────────────────

export async function createLead(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const svc = service()
    const [user, responsableId] = await Promise.all([getUser(), svc.getResponsableId()])
    const lead = await svc.createLead({
      section_id:             form.get('section_id') as string,
      nombre:                 form.get('nombre') as string,
      empresa:                (form.get('empresa') as string) || undefined,
      email:                  (form.get('email') as string) || undefined,
      telefono:               (form.get('telefono') as string) || undefined,
      requerimientos:         (form.get('requerimientos') as string) || undefined,
      requirements_file_path: (form.get('requirements_file_path') as string) || undefined,
      responsable_id:         responsableId,
      vendedor_id:            parseVendedor(form) ?? undefined,
    }, user.id)

    if (lead.vendedor_id) {
      const full = await svc.getLeadById(lead.id)
      if (full) await autoConvertLead(full, await getFullName(user.id))
    }

    revalidatePath('/leads')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateLead(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await getUser()
    const v = form.get('vendedor_id') as string
    await service().updateLead(id, {
      nombre:         form.get('nombre') as string,
      empresa:        (form.get('empresa') as string) || undefined,
      email:          (form.get('email') as string) || undefined,
      telefono:       (form.get('telefono') as string) || undefined,
      requerimientos: (form.get('requerimientos') as string) || undefined,
      vendedor_id:    (!v || v === '__none__') ? null : v,
    })

    const lead = await service().getLeadById(id)
    if (lead) await autoConvertLead(lead, await getFullName(user.id))

    revalidatePath('/leads')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteLead(id: string, sectionId: string): Promise<void> {
  await service().deleteLead(id)
  revalidatePath('/leads')
  redirect(`/leads?sec=${sectionId}`)
}

export async function deleteLeadSilent(id: string): Promise<void> {
  await service().deleteLead(id)
  revalidatePath('/leads')
}

export async function bulkImportLeads(
  rows: Array<{
    nombre: string
    empresa?: string
    email?: string
    telefono?: string
    requerimientos?: string
  }>,
  sectionId: string,
): Promise<{ count: number } | { error: string }> {
  try {
    const svc = service()
    const [user, responsableId] = await Promise.all([getUser(), svc.getResponsableId()])
    const count = await svc.bulkImportLeads(rows, sectionId, user.id, responsableId)
    revalidatePath('/leads')
    return { count }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function createLeadAndReturn(
  form: FormData,
): Promise<{ id: string } | { error: string }> {
  try {
    const svc = service()
    const [user, responsableId] = await Promise.all([getUser(), svc.getResponsableId()])
    const v = form.get('vendedor_id') as string
    const lead = await svc.createLead({
      section_id:             form.get('section_id') as string,
      nombre:                 form.get('nombre') as string,
      empresa:                (form.get('empresa') as string) || undefined,
      email:                  (form.get('email') as string) || undefined,
      telefono:               (form.get('telefono') as string) || undefined,
      requerimientos:         (form.get('requerimientos') as string) || undefined,
      requirements_file_path: (form.get('requirements_file_path') as string) || undefined,
      responsable_id:         responsableId,
      vendedor_id:            (!v || v === '__none__') ? undefined : v,
    }, user.id)

    if (lead.vendedor_id) {
      const full = await svc.getLeadById(lead.id)
      if (full) await autoConvertLead(full, await getFullName(user.id))
    }

    revalidatePath('/leads')
    return { id: lead.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function replaceLeadRequirementFile(
  leadId: string,
  newPath: string,
): Promise<{ error?: string }> {
  try {
    const svc = service()
    const existing = await svc.getLeadById(leadId)
    if (existing?.requirements_file_path) {
      // Best-effort: remove the previous file. Row update proceeds regardless.
      await supabaseAdmin.storage.from('media').remove([existing.requirements_file_path])
    }
    await svc.updateLead(leadId, { requirements_file_path: newPath })
    revalidatePath('/leads')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function convertLeadToOpportunity(
  leadId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const oppNombre  = form.get('nombre') as string
    const ownerId    = form.get('owner_id') as string
    const lead       = await service().getLeadById(leadId)
    const { company_id, contact_id } = lead
      ? await resolveCompanyContact({ lead, ownerId })
      : {}

    const oppService = new OpportunityService(new OpportunityRepository())
    const opp = await oppService.create({
      nombre:           oppNombre,
      business_unit:    form.get('business_unit'),
      fuente:           form.get('fuente'),
      owner_id:         ownerId,
      etapa:            'nuevo_lead',
      monto_estimado:   0,
      probabilidad:     0,
      next_activity_at: (form.get('next_activity_at') as string | null) ?? undefined,
      notas:            (form.get('notas') as string) || undefined,
      company_id,
      contact_id,
    })

    await service().updateLead(leadId, { converted_opportunity_id: opp.id })
    if (lead) await carryOverRequirementFile(lead, opp.id, ownerId)
    revalidatePath('/leads')
    revalidatePath('/oportunidades')

    after(async () => {
      try {
        const user = await getUser()
        const [leadRes, userRes, mgmtIds] = await Promise.all([
          supabaseAdmin.from('leads').select('nombre').eq('id', leadId).single(),
          supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single(),
          getManagementProfileIds(),
        ])
        if (leadRes.data && userRes.data) {
          const convertedByName = userRes.data.full_name
          if (mgmtIds.length) {
            await notifyLeadConverted({
              recipientIds: mgmtIds,
              leadId,
              leadName:     leadRes.data.nombre,
              oppId:        opp.id,
              oppNombre,
              convertedByName,
            })
          }
          // El responsable elegido en el modal también debe enterarse — antes solo
          // se notificaba a dirección/gerencia, dejando al vendedor sin aviso.
          await notifyOpportunityAssigned({
            recipientId:    ownerId,
            oppId:          opp.id,
            oppNombre,
            leadName:       leadRes.data.nombre,
            assignedByName: convertedByName,
          })
        }
      } catch { /* notificaciones no bloquean */ }
    })

    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}
