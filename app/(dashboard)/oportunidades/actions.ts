'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { OpportunityFileRepository } from '@/lib/repositories/supabase/OpportunityFileRepository'
import { OpportunityFileService } from '@/lib/services/OpportunityFileService'
import { createOpportunitySchema, updateOpportunitySchema, stageTransitionSchema } from '@/lib/validations/opportunity'
import type { OpportunityStage } from '@/lib/validations/opportunity'
import type { OpportunityFileCategoria } from '@/lib/validations/opportunityFile'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyOppClosed, getManagementProfileIds } from '@/lib/notifications/send'

function makeService() {
  return new OpportunityService(new OpportunityRepository())
}

function fileService() {
  return new OpportunityFileService(new OpportunityFileRepository())
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user
}

function parseForm(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of form.entries()) {
    if (value === '' || value === 'null') continue
    obj[key] = value
  }
  // Coerce numeric fields
  for (const field of ['monto_estimado', 'monto_final', 'probabilidad', 'tipo_cambio_estimado', 'tipo_cambio_final']) {
    if (obj[field] !== undefined) obj[field] = Number(obj[field])
  }
  return obj
}

export type ActionState = { error: string } | null

export async function createOpportunity(_prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = createOpportunitySchema.safeParse(parseForm(form))
  if (!raw.success) return { error: raw.error.errors[0].message }

  try {
    const svc = makeService()
    const opp = await svc.create(raw.data)
    redirect(`/oportunidades/${opp.id}`)
  } catch (e) {
    if ((e as { digest?: string }).digest) throw e // Next.js redirect
    return { error: (e as Error).message }
  }
}

export async function updateOpportunity(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = updateOpportunitySchema.safeParse(parseForm(form))
  if (!raw.success) return { error: raw.error.errors[0].message }

  try {
    await makeService().update(id, raw.data)
    revalidatePath(`/oportunidades/${id}`)
    revalidatePath('/oportunidades')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function moveToStage(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = stageTransitionSchema.safeParse(parseForm(form))
  if (!raw.success) return { error: raw.error.errors[0].message }

  try {
    await makeService().moveToStage(id, raw.data)
    revalidatePath(`/oportunidades/${id}`)
    revalidatePath('/oportunidades')

    if (raw.data.etapa === 'ganado' || raw.data.etapa === 'perdido') {
      void fireOppClosedNotification(id, raw.data.etapa)
    }

    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

async function fireOppClosedNotification(
  id: string,
  etapa: 'ganado' | 'perdido',
): Promise<void> {
  try {
    const [oppRes, mgmtIds] = await Promise.all([
      supabaseAdmin
        .from('opportunities')
        .select('nombre, moneda, monto_final, monto_final_mxn, owner:profiles!owner_id(full_name)')
        .eq('id', id)
        .single(),
      getManagementProfileIds(),
    ])
    if (oppRes.data && mgmtIds.length) {
      await notifyOppClosed({
        recipientIds: mgmtIds,
        oppId:        id,
        oppNombre:    oppRes.data.nombre,
        etapa,
        vendedorName: (oppRes.data.owner as { full_name: string } | null)?.full_name ?? 'Sin asignar',
        moneda:       oppRes.data.moneda,
        montoFinal:   oppRes.data.monto_final ?? undefined,
        montoFinalMxn: oppRes.data.monto_final_mxn ?? undefined,
      })
    }
  } catch { /* notificaciones no bloquean */ }
}

export async function kanbanMoveToStage(
  id: string,
  stage: OpportunityStage,
  payload?: { montoFinal?: number; tipoCambioFinal?: number; cotizacionPath?: string; ordenCompraPath?: string },
): Promise<{ error?: string }> {
  try {
    const { montoFinal, tipoCambioFinal, cotizacionPath, ordenCompraPath } = payload ?? {}
    await makeService().moveToStage(id, {
      etapa: stage,
      ...(montoFinal       !== undefined && { monto_final: montoFinal }),
      ...(tipoCambioFinal  !== undefined && { tipo_cambio_final: tipoCambioFinal }),
      ...(cotizacionPath   !== undefined && { cotizacion_path: cotizacionPath }),
      ...(ordenCompraPath  !== undefined && { orden_compra_path: ordenCompraPath }),
    })
    revalidatePath('/oportunidades')
    revalidatePath(`/oportunidades/${id}`)

    if (stage === 'ganado' || stage === 'perdido') {
      void fireOppClosedNotification(id, stage)
    }

    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function kanbanReopenStage(
  id: string,
  stage: OpportunityStage,
): Promise<{ error?: string }> {
  try {
    await makeService().update(id, { etapa: stage, monto_final: null })
    revalidatePath('/oportunidades')
    revalidatePath(`/oportunidades/${id}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteOpportunity(id: string): Promise<void> {
  await makeService().delete(id)
  revalidatePath('/oportunidades')
  redirect('/oportunidades')
}

export async function listOpportunityFiles(opportunityId: string) {
  return fileService().listByOpportunity(opportunityId)
}

export async function addOpportunityFile(data: {
  opportunity_id: string
  nombre:         string
  file_path:      string
  mime_type?:     string
  file_size?:     number
  categoria?:     OpportunityFileCategoria
}): Promise<{ error?: string }> {
  try {
    const user = await getUser()
    await fileService().addFile(data, user.id)
    revalidatePath(`/oportunidades/${data.opportunity_id}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteOpportunityFile(oppId: string, fileId: string): Promise<{ error?: string }> {
  try {
    const opp = await makeService().getById(oppId)
    await fileService().deleteFile(fileId, opp)
    revalidatePath(`/oportunidades/${oppId}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
