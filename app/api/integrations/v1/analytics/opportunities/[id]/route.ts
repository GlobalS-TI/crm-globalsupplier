import type { NextRequest } from 'next/server'
import { runIntegration } from '@/lib/integrations/http'

// GET — una oportunidad de cualquier unidad con todas sus actividades. Sólo lectura;
// requiere can_read_analytics + can_read_history.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return runIntegration(req, ({ service, keyHash }) => service.getHistoryOpportunity(keyHash, id))
}
