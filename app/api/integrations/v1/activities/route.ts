import type { NextRequest } from 'next/server'
import { readJsonBody, runIntegration } from '@/lib/integrations/http'

// Responde la oportunidad completa con sus actividades actualizadas
export async function POST(req: NextRequest) {
  return runIntegration(
    req,
    async ({ service, keyHash }) => service.createActivity(keyHash, await readJsonBody(req)),
    201,
  )
}
