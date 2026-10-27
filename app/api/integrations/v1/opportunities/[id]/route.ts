import type { NextRequest } from 'next/server'
import { readJsonBody, runIntegration } from '@/lib/integrations/http'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  return runIntegration(req, ({ service, keyHash }) => service.getOpportunity(keyHash, id))
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  return runIntegration(req, async ({ service, keyHash }) =>
    service.updateOpportunity(keyHash, id, await readJsonBody(req)),
  )
}
