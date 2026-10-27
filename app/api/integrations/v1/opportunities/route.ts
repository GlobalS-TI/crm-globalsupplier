import type { NextRequest } from 'next/server'
import { readJsonBody, runIntegration } from '@/lib/integrations/http'

// GET ?etapa= — sólo las oportunidades que creó esta integración
export async function GET(req: NextRequest) {
  const etapa = req.nextUrl.searchParams.get('etapa') ?? undefined
  return runIntegration(req, ({ service, keyHash }) => service.listOpportunities(keyHash, { etapa }))
}

export async function POST(req: NextRequest) {
  return runIntegration(
    req,
    async ({ service, keyHash }) => service.createOpportunity(keyHash, await readJsonBody(req)),
    201,
  )
}
