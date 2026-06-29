'use server'

import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyStaleDigest, getManagementProfileIds } from '@/lib/notifications/send'

export async function notifyStaleOpportunities(): Promise<{ sent: number; staleCount: number; error?: string }> {
  try {
    const { data: opps } = await supabaseAdmin
      .from('opportunities')
      .select('nombre, etapa, owner:profiles!owner_id(full_name)')
      .eq('stale', true)

    if (!opps?.length) return { sent: 0, staleCount: 0 }

    const mgmtIds = await getManagementProfileIds()
    if (!mgmtIds.length) return { sent: 0, staleCount: opps.length }

    await notifyStaleDigest({
      recipientIds: mgmtIds,
      opps: opps.map(o => ({
        nombre: o.nombre,
        owner:  (o.owner as { full_name: string } | null)?.full_name ?? 'Sin asignar',
        etapa:  o.etapa,
      })),
    })

    return { sent: mgmtIds.length, staleCount: opps.length }
  } catch (e) {
    return { sent: 0, staleCount: 0, error: (e as Error).message }
  }
}
