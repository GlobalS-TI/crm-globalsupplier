import type { NextRequest } from 'next/server'
import { runIntegration } from '@/lib/integrations/http'

// GET — contacto con sus oportunidades; requiere can_read_analytics + can_read_history.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return runIntegration(req, ({ service, keyHash }) => service.getHistoryContact(keyHash, id))
}
