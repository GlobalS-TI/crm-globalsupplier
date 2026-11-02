'use server'

import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'
import { IntegrationAdminRepository } from '@/lib/repositories/supabase/IntegrationAdminRepository'
import { IntegrationAdminService } from '@/lib/services/IntegrationAdminService'

// Un Server Action se puede invocar directo, sin pasar por la página: el permiso real lo
// revalida integration_set_permissions() en la DB (director_general o administracion).
export async function updateIntegrationPermissions(raw: unknown): Promise<{ error?: string }> {
  try {
    await new IntegrationAdminService(new IntegrationAdminRepository()).updatePermissions(raw)
    revalidatePath('/integraciones')
    return {}
  } catch (err) {
    if (err instanceof ZodError) return { error: 'Datos inválidos' }
    const code = (err as { code?: string }).code
    if (code === '42501') return { error: 'No tienes permiso para cambiar integraciones' }
    if (code === 'P0002') return { error: 'La integración ya no existe' }
    console.error('[integraciones] updatePermissions', err)
    return { error: 'No se pudo guardar el cambio' }
  }
}
