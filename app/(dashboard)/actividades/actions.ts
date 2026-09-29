'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ActivityRepository } from '@/lib/repositories/supabase/ActivityRepository'
import { ActivityService } from '@/lib/services/ActivityService'
import { createActivitySchema } from '@/lib/validations/activity'

export type ActionState = { error: string } | null

function makeService() {
  return new ActivityService(new ActivityRepository())
}

function parseForm(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of form.entries()) {
    if (value === '' || value === 'null') continue
    // El cliente ya envia 'fecha' en ISO con offset (ver ActivityForm). Este
    // fallback es solo por si llega un naive "YYYY-MM-DDTHH:mm" — new Date()
    // aqui correria en el servidor y lo interpretaria en la TZ del servidor
    // (no la del usuario), asi que se fuerza UTC explicito en vez de adivinar.
    if (key === 'fecha' && typeof value === 'string' && !value.includes('Z') && !value.includes('+')) {
      obj[key] = new Date(`${value}:00Z`).toISOString()
    } else {
      obj[key] = value
    }
  }
  return obj
}

export async function createActivity(_prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = createActivitySchema.safeParse(parseForm(form))
  if (!raw.success) return { error: raw.error.errors[0].message }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  try {
    await makeService().create(raw.data, user.id)
    revalidatePath(`/oportunidades/${raw.data.opportunity_id}`)
    revalidatePath('/oportunidades')
    revalidatePath('/actividades')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function completeActivity(id: string, opportunityId: string): Promise<{ error?: string }> {
  try {
    await makeService().complete(id)
    revalidatePath(`/oportunidades/${opportunityId}`)
    revalidatePath('/oportunidades')
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteActivity(id: string, opportunityId: string): Promise<{ error?: string }> {
  try {
    await makeService().delete(id)
    revalidatePath(`/oportunidades/${opportunityId}`)
    revalidatePath('/oportunidades')
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
