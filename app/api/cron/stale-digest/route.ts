import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyStaleDigest, getManagementProfileIds } from '@/lib/notifications/send'

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('Authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: opps } = await supabaseAdmin
    .from('opportunities')
    .select('nombre, etapa, owner:profiles!owner_id(full_name)')
    .eq('stale', true)

  if (!opps?.length) {
    return NextResponse.json({ sent: 0, staleCount: 0 })
  }

  const mgmtIds = await getManagementProfileIds()
  if (!mgmtIds.length) {
    return NextResponse.json({ sent: 0, staleCount: opps.length })
  }

  await notifyStaleDigest({
    recipientIds: mgmtIds,
    opps: opps.map(o => ({
      nombre: o.nombre,
      owner:  (o.owner as { full_name: string } | null)?.full_name ?? 'Sin asignar',
      etapa:  o.etapa,
    })),
  })

  return NextResponse.json({ sent: mgmtIds.length, staleCount: opps.length })
}
