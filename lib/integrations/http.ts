import { createHash } from 'node:crypto'
import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { IntegrationService } from '@/lib/services/IntegrationService'
import { IntegrationRepository } from '@/lib/repositories/supabase/IntegrationRepository'
import { IntegrationError } from '@/lib/repositories/interfaces/IIntegrationRepository'

// Formato emitido por integration_issue_key() en la DB
const API_KEY_PATTERN = /^sint_[0-9a-f]{64}$/

interface IntegrationContext {
  service: IntegrationService
  keyHash: string
}

function respond(body: unknown, status: number) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// Envuelve un route handler de /api/integrations/v1: extrae la key del header
// Authorization, la hashea (la key en claro nunca sale de este proceso) y traduce
// errores a HTTP. La autenticación real y el alcance los resuelve la DB.
export async function runIntegration(
  req: NextRequest,
  handler: (ctx: IntegrationContext) => Promise<unknown>,
  successStatus = 200,
) {
  const header = req.headers.get('authorization') ?? ''
  const key = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!API_KEY_PATTERN.test(key)) return respond({ error: 'API key inválida' }, 401)

  try {
    const data = await handler({
      service: new IntegrationService(new IntegrationRepository()),
      keyHash: hashApiKey(key),
    })
    return respond({ data }, successStatus)
  } catch (err) {
    if (err instanceof ZodError) {
      return respond({ error: 'Datos inválidos', issues: err.issues }, 422)
    }
    if (err instanceof IntegrationError) {
      return respond({ error: err.message, ...(err.detail ? { detail: err.detail } : {}) }, err.status)
    }
    console.error('[integration] error no controlado', err)
    return respond({ error: 'Error interno' }, 500)
  }
}

export async function readJsonBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json()
  } catch {
    throw new IntegrationError(400, 'El cuerpo debe ser JSON válido')
  }
}
