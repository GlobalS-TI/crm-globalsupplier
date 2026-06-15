'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { LeadSectionRepository, LeadRepository } from '@/lib/repositories/supabase/LeadRepository'
import { LeadService } from '@/lib/services/LeadService'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'

type ActionState = { error: string } | null

function service() {
  return new LeadService(new LeadSectionRepository(), new LeadRepository())
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user
}

// ── Sections ──────────────────────────────────────────────────────

export async function createSection(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await getUser()
    const section = await service().createSection({
      nombre:      form.get('nombre') as string,
      descripcion: (form.get('descripcion') as string) || undefined,
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
      nombre:      form.get('nombre') as string,
      descripcion: (form.get('descripcion') as string) || undefined,
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
    const user = await getUser()
    await service().createLead({
      section_id:     form.get('section_id') as string,
      nombre:         form.get('nombre') as string,
      empresa:        (form.get('empresa') as string) || undefined,
      email:          (form.get('email') as string) || undefined,
      telefono:       (form.get('telefono') as string) || undefined,
      requerimientos: (form.get('requerimientos') as string) || undefined,
      assigned_to:    (() => { const v = form.get('assigned_to') as string; return (!v || v === '__none__') ? undefined : v })(),
    }, user.id)
    revalidatePath('/leads')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateLead(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const assignedTo = form.get('assigned_to') as string
    await service().updateLead(id, {
      nombre:         form.get('nombre') as string,
      empresa:        (form.get('empresa') as string) || undefined,
      email:          (form.get('email') as string) || undefined,
      telefono:       (form.get('telefono') as string) || undefined,
      requerimientos: (form.get('requerimientos') as string) || undefined,
      // '__none__' sentinel or empty → null (clears assignment)
      assigned_to:    (!assignedTo || assignedTo === '__none__') ? null : assignedTo,
    })
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
    const user  = await getUser()
    const count = await service().bulkImportLeads(rows, sectionId, user.id)
    revalidatePath('/leads')
    return { count }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// Returns created lead data for client-side file upload flow
export async function createLeadAndReturn(
  form: FormData,
): Promise<{ id: string } | { error: string }> {
  try {
    const user = await getUser()
    const assignedTo = form.get('assigned_to') as string
    const lead = await service().createLead({
      section_id:     form.get('section_id') as string,
      nombre:         form.get('nombre') as string,
      empresa:        (form.get('empresa') as string) || undefined,
      email:          (form.get('email') as string) || undefined,
      telefono:       (form.get('telefono') as string) || undefined,
      requerimientos: (form.get('requerimientos') as string) || undefined,
      assigned_to:    (!assignedTo || assignedTo === '__none__') ? undefined : assignedTo,
    }, user.id)
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

export async function assignLead(id: string, assignedTo: string | null): Promise<ActionState> {
  try {
    await service().updateLead(id, {
      assigned_to: assignedTo ?? undefined,
    })
    revalidatePath('/leads')
    return null
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
    const oppService = new OpportunityService(new OpportunityRepository())
    const opp = await oppService.create({
      nombre:               form.get('nombre') as string,
      business_unit:        form.get('business_unit') as never,
      fuente:               form.get('fuente') as never,
      owner_id:             form.get('owner_id') as string,
      etapa:                'nuevo_lead',
      monto_estimado:       0,
      probabilidad:         0,
      next_activity_at:     form.get('next_activity_at') as string,
      notas:                (form.get('notas') as string) || undefined,
    })

    await service().updateLead(leadId, { converted_opportunity_id: opp.id })
    revalidatePath('/leads')
    revalidatePath('/oportunidades')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}
