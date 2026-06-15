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
    // datetime-local gives "YYYY-MM-DDTHH:mm" without offset — append Z for UTC
    if (key === 'fecha' && typeof value === 'string' && !value.includes('Z') && !value.includes('+')) {
      obj[key] = new Date(value).toISOString()
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
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
