import type { NextRequest } from 'next/server'
import { runIntegration } from '@/lib/integrations/http'

// GET — sólo lectura, todas las unidades (requiere can_read_analytics). Mismos filtros
// que /reportes + limit/offset. Sólo GET: cualquier otro método responde 405.
export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams)
  return runIntegration(req, ({ service, keyHash }) => service.listAnalyticsOpportunities(keyHash, query))
}
