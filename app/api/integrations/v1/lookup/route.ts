import type { NextRequest } from 'next/server'
import { runIntegration } from '@/lib/integrations/http'

// GET /api/integrations/v1/lookup?rfc=|email=|telefono= — búsqueda anti-duplicados
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  return runIntegration(req, ({ service, keyHash }) =>
    service.findDuplicates(keyHash, {
      rfc:      params.get('rfc') ?? undefined,
      email:    params.get('email') ?? undefined,
      telefono: params.get('telefono') ?? undefined,
    }),
  )
}
