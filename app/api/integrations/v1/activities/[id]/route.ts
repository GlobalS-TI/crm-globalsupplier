import type { NextRequest } from 'next/server'
import { readJsonBody, runIntegration } from '@/lib/integrations/http'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return runIntegration(req, async ({ service, keyHash }) =>
    service.updateActivity(keyHash, id, await readJsonBody(req)),
  )
}
