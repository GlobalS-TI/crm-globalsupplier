'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProjectService } from '@/lib/services/ProjectService'
import { ProjectRepository } from '@/lib/repositories/supabase/ProjectRepository'

export type ActionState = { error: string } | null

function makeService() {
  return new ProjectService(new ProjectRepository())
}

function parseForm(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string' && value !== '') obj[key] = value
  }
  // numeric coercion
  if (obj.estimated_hours) obj.estimated_hours = Number(obj.estimated_hours)
  return obj
}

async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// ----------------------------------------------------------------
// Proyecto
// ----------------------------------------------------------------
export async function createProject(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autenticado' }

  const result = await makeService().createProject(parseForm(form), user.id).catch(e => e)
  if (result instanceof Error) return { error: result.message }

  redirect(`/proyectos/${result.id}`)
}

export async function updateProject(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await makeService().updateProject(id, parseForm(form))
    revalidatePath(`/proyectos/${id}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ----------------------------------------------------------------
// Status
// ----------------------------------------------------------------
export async function advanceStatus(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autenticado' }

  const comment = form.get('comment')?.toString().trim() || undefined
  try {
    await makeService().advanceStatus(id, user.id, comment)
    revalidatePath(`/proyectos/${id}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ----------------------------------------------------------------
// Brief
// ----------------------------------------------------------------
export async function saveBrief(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const raw: Record<string, unknown> = {}
  for (const [k, v] of form.entries()) {
    if (typeof v === 'string' && v !== '') raw[k] = v
  }
  try {
    await makeService().saveBrief(id, raw)
    revalidatePath(`/proyectos/${id}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ----------------------------------------------------------------
// Handoff
// ----------------------------------------------------------------
export async function saveHandoff(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = {
    component_states:       form.get('component_states')       === 'on',
    component_states_note:  form.get('component_states_note')?.toString()  || undefined,
    breakpoints_defined:    form.get('breakpoints_defined')    === 'on',
    breakpoints_note:       form.get('breakpoints_note')?.toString()       || undefined,
    interactions_annotated: form.get('interactions_annotated') === 'on',
    interactions_note:      form.get('interactions_note')?.toString()      || undefined,
    assets_exported:        form.get('assets_exported')        === 'on',
    assets_note:            form.get('assets_note')?.toString()            || undefined,
    naming_convention:      form.get('naming_convention')      === 'on',
    naming_note:            form.get('naming_note')?.toString()            || undefined,
  }
  try {
    await makeService().saveHandoff(id, raw)
    revalidatePath(`/proyectos/${id}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ----------------------------------------------------------------
// Decision log
// ----------------------------------------------------------------
export async function addDecisionEntry(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser()
  if (!user) return { error: 'No autenticado' }

  const entry = form.get('entry')?.toString().trim()
  if (!entry) return { error: 'La entrada no puede estar vacía' }

  try {
    await makeService().addDecisionEntry(id, { entry }, user.id)
    revalidatePath(`/proyectos/${id}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ----------------------------------------------------------------
// Files
// ----------------------------------------------------------------
export async function addFile(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const raw = {
    label: form.get('label')?.toString().trim(),
    url:   form.get('url')?.toString().trim(),
    type:  form.get('type')?.toString(),
  }
  try {
    await makeService().addFile(id, raw)
    revalidatePath(`/proyectos/${id}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteFile(fileId: string, projectId: string): Promise<void> {
  await makeService().deleteFile(fileId)
  revalidatePath(`/proyectos/${projectId}`)
}
