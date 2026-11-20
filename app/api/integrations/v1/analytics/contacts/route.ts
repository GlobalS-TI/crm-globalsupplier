import type { NextRequest } from 'next/server'
import { runIntegration } from '@/lib/integrations/http'

// GET ?company_id=&q=&limit=&offset= — contactos, sólo lectura; requiere can_read_analytics +
// can_read_history. Email/teléfono/celular sólo con can_read_contact_pii.
export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams)
  return runIntegration(req, ({ service, keyHash }) => service.listHistoryContacts(keyHash, query))
}
