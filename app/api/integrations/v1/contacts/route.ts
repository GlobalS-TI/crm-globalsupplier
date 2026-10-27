import type { NextRequest } from 'next/server'
import { readJsonBody, runIntegration } from '@/lib/integrations/http'

export async function POST(req: NextRequest) {
  return runIntegration(
    req,
    async ({ service, keyHash }) => service.createContact(keyHash, await readJsonBody(req)),
    201,
  )
}
