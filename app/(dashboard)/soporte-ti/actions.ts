'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ITTicketService } from '@/lib/services/ITTicketService'
import { ITTicketRepository } from '@/lib/repositories/supabase/ITTicketRepository'
import { ProfileRepository } from '@/lib/repositories/supabase/ProfileRepository'
import {
  notifyITTicketAssigned,
  notifyITTicketStatusChanged,
  notifyITTicketMessage,
} from '@/lib/notifications/send'
import type { ITTicketStatus } from '@/lib/types'

export type ActionState = { error: string } | null

function makeService() {
  return new ITTicketService(new ITTicketRepository(), new ProfileRepository())
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
    if (typeof value === 'string' && value !== '') obj[key] = value
  }
  return obj
}

async function getFullName(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from('profiles').select('full_name').eq('id', userId).single()
  return data?.full_name ?? 'Usuario'
}

// ----------------------------------------------------------------
// Notificaciones — no bloquean la acción principal.
// ----------------------------------------------------------------
async function fireITTicketAssignedNotification(recipientId: string, ticketId: string, ticketTitle: string, requesterId: string): Promise<void> {
  try {
    await notifyITTicketAssigned({
      recipientId,
      ticketId,
      ticketTitle,
      requesterName: await getFullName(requesterId),
    })
  } catch { /* notificaciones no bloquean */ }
}

async function fireITTicketStatusChangedNotification(recipientId: string, ticketId: string, ticketTitle: string, status: ITTicketStatus, changedById: string): Promise<void> {
  try {
    await notifyITTicketStatusChanged({
      recipientId,
      ticketId,
      ticketTitle,
      status,
      changedByName: await getFullName(changedById),
    })
  } catch { /* notificaciones no bloquean */ }
}

async function fireITTicketMessageNotification(recipientId: string, ticketId: string, ticketTitle: string, authorId: string): Promise<void> {
  try {
    await notifyITTicketMessage({
      recipientId,
      ticketId,
      ticketTitle,
      authorName: await getFullName(authorId),
    })
  } catch { /* notificaciones no bloquean */ }
}

// ----------------------------------------------------------------
// Ticket
// ----------------------------------------------------------------
export async function createTicket(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getUser()

  let ticketId: string
  try {
    const ticket = await makeService().createTicket(parseForm(form), user.id)
    ticketId = ticket.id
    const assigneeId = ticket.assignee_id
    if (assigneeId) {
      after(() => fireITTicketAssignedNotification(assigneeId, ticket.id, ticket.title, user.id))
    }
  } catch (e) {
    return { error: (e as Error).message }
  }
  redirect(`/soporte-ti/${ticketId}`)
}

export async function advanceStatus(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getUser()
  const comment = form.get('comment')?.toString().trim() || undefined

  try {
    const updated = await makeService().advanceStatus(id, user.id, comment)
    revalidatePath(`/soporte-ti/${id}`)
    after(() => fireITTicketStatusChangedNotification(updated.requester_id, id, updated.title, updated.status, user.id))
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function setPriority(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const priority = form.get('priority')?.toString()
  try {
    await makeService().setPriority(id, { priority })
    revalidatePath(`/soporte-ti/${id}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function addMessage(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await getUser()
  const raw = {
    content:    form.get('content')?.toString().trim(),
    file_url:   form.get('file_url')?.toString().trim()   || undefined,
    file_label: form.get('file_label')?.toString().trim() || undefined,
  }

  try {
    const ticket = await makeService().getTicketById(id)
    if (!ticket) return { error: 'Ticket no encontrado' }

    await makeService().addMessage(id, raw, user.id)
    revalidatePath(`/soporte-ti/${id}`)

    // Si escribe soporte_ti, notifica al requester; si no, notifica al assignee (si existe).
    const { data: actorProfile } = await supabaseAdmin.from('profiles').select('role').eq('id', user.id).single()
    const recipientId = actorProfile?.role === 'soporte_ti' ? ticket.requester_id : ticket.assignee_id
    if (recipientId && recipientId !== user.id) {
      after(() => fireITTicketMessageNotification(recipientId, id, ticket.title, user.id))
    }
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ----------------------------------------------------------------
// Files
// ----------------------------------------------------------------
export async function addITTicketFile(data: {
  ticket_id: string
  nombre:    string
  file_path: string
  mime_type?: string
  file_size?: number
}): Promise<{ error?: string }> {
  try {
    const user = await getUser()
    await makeService().addFile(data, user.id)
    revalidatePath(`/soporte-ti/${data.ticket_id}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteITTicketFile(ticketId: string, fileId: string): Promise<{ error?: string }> {
  try {
    await makeService().deleteFile(fileId)
    revalidatePath(`/soporte-ti/${ticketId}`)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
