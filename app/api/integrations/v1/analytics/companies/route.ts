import type { NextRequest } from 'next/server'
import { runIntegration } from '@/lib/integrations/http'

// GET ?q=&limit=&offset= — empresas, sólo lectura; requiere can_read_analytics + can_read_history.
export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams)
  return runIntegration(req, ({ service, keyHash }) => service.listHistoryCompanies(keyHash, query))
}
