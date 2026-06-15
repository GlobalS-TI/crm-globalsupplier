'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { createOpportunitySchema, updateOpportunitySchema, stageTransitionSchema } from '@/lib/validations/opportunity'
import type { OpportunityStage } from '@/lib/validations/opportunity'

function makeService() {
  return new OpportunityService(new OpportunityRepository())
}

function parseForm(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of form.entries()) {
    if (value === '' || value === 'null') continue
    obj[key] = value
  }
  // Coerce numeric fields
  for (const field of ['monto_estimado', 'monto_final', 'probabilidad']) {
    if (obj[field] !== undefined) obj[field] = Number(obj[field])
  }
  return obj
}

export type ActionState = { error: string } | null

export async function createOpportunity(_prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = createOpportunitySchema.safeParse(parseForm(form))
  if (!raw.success) return { error: raw.error.errors[0].message }

  try {
    const svc = makeService()
    const opp = await svc.create(raw.data)
    redirect(`/oportunidades/${opp.id}`)
  } catch (e) {
    if ((e as { digest?: string }).digest) throw e // Next.js redirect
    return { error: (e as Error).message }
  }
}

export async function updateOpportunity(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = updateOpportunitySchema.safeParse(parseForm(form))
  if (!raw.success) return { error: raw.error.errors[0].message }

  try {
    await makeService().update(id, raw.data)
    revalidatePath(`/oportunidades/${id}`)
    revalidatePath('/oportunidades')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function moveToStage(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = stageTransitionSchema.safeParse(parseForm(form))
  if (!raw.success) return { error: raw.error.errors[0].message }

  try {
    await makeService().moveToStage(id, raw.data)
    revalidatePath(`/oportunidades/${id}`)
    revalidatePath('/oportunidades')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function kanbanMoveToStage(
  id: string,
  stage: OpportunityStage,
  montoFinal?: number,
): Promise<{ error?: string }> {
  try {
    await makeService().moveToStage(id, {
      etapa: stage,
      ...(montoFinal !== undefined && { monto_final: montoFinal }),
    })
    revalidatePath('/oportunidades')
    revalidatePath(`/oportunidades/${id}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function kanbanReopenStage(
  id: string,
  stage: OpportunityStage,
): Promise<{ error?: string }> {
  try {
    await makeService().update(id, { etapa: stage, monto_final: null })
    revalidatePath('/oportunidades')
    revalidatePath(`/oportunidades/${id}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteOpportunity(id: string): Promise<void> {
  await makeService().delete(id)
  revalidatePath('/oportunidades')
  redirect('/oportunidades')
}
