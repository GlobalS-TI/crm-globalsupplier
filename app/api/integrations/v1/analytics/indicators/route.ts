import type { NextRequest } from 'next/server'
import { runIntegration } from '@/lib/integrations/http'

// GET — indicadores comerciales sobre las oportunidades filtradas (mismos que la pestaña
// Indicadores de /reportes). Sólo lectura; requiere can_read_analytics.
export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams)
  return runIntegration(req, ({ service, keyHash }) => service.getAnalyticsIndicators(keyHash, query))
}
