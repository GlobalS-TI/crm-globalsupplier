'use server'

import { createClient } from '@/lib/supabase/server'
import { SalesTargetRepository } from '@/lib/repositories/supabase/SalesTargetRepository'
import { SalesTargetService } from '@/lib/services/SalesTargetService'

function makeService() {
  return new SalesTargetService(new SalesTargetRepository())
}

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function setSalesTarget(
  vendedorId: string,
  year: number,
  month: number,
  targetAmount: number,
): Promise<{ error?: string }> {
  try {
    const userId = await getCurrentUserId()
    await makeService().setTarget(
      { vendedor_id: vendedorId, year, month, target_amount: targetAmount },
      userId,
    )
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
