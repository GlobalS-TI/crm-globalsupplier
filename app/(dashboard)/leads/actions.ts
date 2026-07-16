'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { LeadSectionRepository, LeadRepository } from '@/lib/repositories/supabase/LeadRepository'
import { ProfileRepository } from '@/lib/repositories/supabase/ProfileRepository'
import { LeadService } from '@/lib/services/LeadService'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
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
 * Al asignar un vendedor a un lead se crea automáticamente la oportunidad correspondiente
 * (business_unit/fuente vienen de la campaña) — ventas ya no necesita acceso a /leads.
 * Idempotente: no-op si el lead no tiene vendedor o ya fue convertido.
 */
async function autoConvertLead(lead: LeadWithRelations, assignedByName: string): Promise<void> {
  if (!lead.vendedor_id || lead.converted_opportunity_id) return

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const oppService = new OpportunityService(new OpportunityRepository())
  const opp = await oppService.create({
    nombre:           lead.empresa ? `${lead.empresa} — ${lead.nombre}` : lead.nombre,
    business_unit:    lead.section.business_unit,
    fuente:           lead.section.fuente,
    owner_id:         lead.vendedor_id,
    etapa:            'nuevo_lead',
    next_activity_at: tomorrow.toISOString(),
    notas:            lead.requerimientos || undefined,
  })

  await service().updateLead(lead.id, { converted_opportunity_id: opp.id })
  revalidatePath('/oportunidades')

  void notifyOpportunityAssigned({
    recipientId:    lead.vendedor_id,
    oppId:          opp.id,
    oppNombre:      opp.nombre,
    leadName:       lead.nombre,
    assignedByName,
  }).catch(() => { /* notificaciones no bloquean */ })
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
      section_id:     form.get('section_id') as string,
      nombre:         form.get('nombre') as string,
      empresa:        (form.get('empresa') as string) || undefined,
      email:          (form.get('email') as string) || undefined,
      telefono:       (form.get('telefono') as string) || undefined,
      requerimientos: (form.get('requerimientos') as string) || undefined,
      responsable_id: responsableId,
      vendedor_id:    parseVendedor(form) ?? undefined,
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
      section_id:     form.get('section_id') as string,
      nombre:         form.get('nombre') as string,
      empresa:        (form.get('empresa') as string) || undefined,
      email:          (form.get('email') as string) || undefined,
      telefono:       (form.get('telefono') as string) || undefined,
      requerimientos: (form.get('requerimientos') as string) || undefined,
      responsable_id: responsableId,
      vendedor_id:    (!v || v === '__none__') ? undefined : v,
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

export async function setLeadRequirementFile(leadId: string, filePath: string): Promise<void> {
  await service().updateLead(leadId, { requirements_file_path: filePath })
  revalidatePath('/leads')
}

export async function convertLeadToOpportunity(
  leadId: string,
  _prev: ActionState,
  form: FormData,
): Promise<ActionState> {
  try {
    const oppNombre = form.get('nombre') as string
    const oppService = new OpportunityService(new OpportunityRepository())
    const opp = await oppService.create({
      nombre:           oppNombre,
      business_unit:    form.get('business_unit'),
      fuente:           form.get('fuente'),
      owner_id:         form.get('owner_id') as string,
      etapa:            'nuevo_lead',
      monto_estimado:   0,
      probabilidad:     0,
      next_activity_at: (form.get('next_activity_at') as string | null) ?? undefined,
      notas:            (form.get('notas') as string) || undefined,
    })

    await service().updateLead(leadId, { converted_opportunity_id: opp.id })
    revalidatePath('/leads')
    revalidatePath('/oportunidades')

    void (async () => {
      try {
        const user = await getUser()
        const [leadRes, userRes, mgmtIds] = await Promise.all([
          supabaseAdmin.from('leads').select('nombre').eq('id', leadId).single(),
          supabaseAdmin.from('profiles').select('full_name').eq('id', user.id).single(),
          getManagementProfileIds(),
        ])
        if (leadRes.data && userRes.data && mgmtIds.length) {
          await notifyLeadConverted({
            recipientIds:    mgmtIds,
            leadId,
            leadName:        leadRes.data.nombre,
            oppId:           opp.id,
            oppNombre,
            convertedByName: userRes.data.full_name,
          })
        }
      } catch { /* notificaciones no bloquean */ }
    })()

    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}
