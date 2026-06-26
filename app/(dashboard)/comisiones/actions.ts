'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ComisionesRepository } from '@/lib/repositories/supabase/ComisionesRepository'
import { ComisionesService } from '@/lib/services/ComisionesService'

function makeService() {
  return new ComisionesService(new ComisionesRepository())
}

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function saveCosto(
  opportunityId: string,
  costo: number,
  notas?: string | null,
): Promise<{ error?: string }> {
  try {
    const userId = await getCurrentUserId()
    await makeService().saveCosto({ opportunity_id: opportunityId, costo, notas }, userId)
    revalidatePath('/comisiones')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
