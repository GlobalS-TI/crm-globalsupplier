import { Resend } from 'resend'
import { render } from '@react-email/render'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Json } from '@/lib/types/database'
import type { NotificationType, NotificationPayload } from './types'
import { StaleDigestEmail } from './templates/staleDigest'
import { OppClosedEmail } from './templates/oppClosed'
import { LeadConvertedEmail } from './templates/leadConverted'
import { OpportunityAssignedEmail } from './templates/opportunityAssigned'
import { ITTicketAssignedEmail } from './templates/itTicketAssigned'
import { ITTicketActivityEmail } from './templates/itTicketActivity'
import { IT_TICKET_STATUS_LABELS } from '@/lib/types'
import type { ITTicketStatus } from '@/lib/types'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'Supply <noreply@globalsupplier.dev>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve los IDs de todos los profiles con rol director o dir_comercial */
export async function getManagementProfileIds(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .in('role', ['director_general', 'direccion_comercial'])
    .eq('is_active', true)
  return data?.map(r => r.id) ?? []
}

/** Resuelve emails a partir de profile IDs usando la auth admin API */
async function resolveEmails(profileIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  await Promise.all(
    profileIds.map(async id => {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id)
      if (data?.user?.email) map.set(id, data.user.email)
    })
  )
  return map
}

// ─── Interfaz pública ─────────────────────────────────────────────────────────

interface SendOptions {
  type:         NotificationType
  recipientIds: string[]
  title:        string
  body:         string
  href?:        string
  payload?:     NotificationPayload
  /** Generador del HTML del email. Recibe la URL de la app. null = no enviar email */
  buildEmail?:  (appUrl: string) => Promise<{ subject: string; html: string }>
}

/**
 * Inserta notificaciones en DB y envía emails.
 * Fire-and-forget: llama con `void sendNotification(...).catch(() => {})` en server actions.
 */
export async function sendNotification({
  type,
  recipientIds,
  title,
  body,
  href,
  payload = {} as NotificationPayload,
  buildEmail,
}: SendOptions): Promise<void> {
  if (!recipientIds.length) return

  // 1. Insertar notificaciones en DB (una fila por destinatario)
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('notifications')
    .insert(
      recipientIds.map(id => ({
        recipient_id: id,
        type,
        title,
        body,
        ...(href !== undefined ? { href } : {}),
        payload: payload as unknown as Json,
      }))
    )
    .select('id, recipient_id')

  if (insertError || !inserted?.length) return

  // 2. Si no hay template de email, terminamos
  if (!buildEmail) return

  // 3. Resolver emails y generar HTML
  const emailMap = await resolveEmails(recipientIds)
  if (!emailMap.size) return

  const { subject, html } = await buildEmail(APP_URL)

  // 4. Enviar un email por destinatario y actualizar el estado en DB
  await Promise.allSettled(
    inserted.map(async row => {
      const email = emailMap.get(row.recipient_id)
      if (!email) return

      try {
        await resend.emails.send({ from: FROM, to: email, subject, html })
        await supabaseAdmin
          .from('notifications')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', row.id)
      } catch (err) {
        await supabaseAdmin
          .from('notifications')
          .update({ email_error: (err as Error).message })
          .eq('id', row.id)
      }
    })
  )
}

// ─── Helpers tipados por evento ───────────────────────────────────────────────

export async function notifyLeadConverted({
  recipientIds,
  leadId,
  leadName,
  oppId,
  oppNombre,
  convertedByName,
}: {
  recipientIds:    string[]
  leadId:          string
  leadName:        string
  oppId:           string
  oppNombre:       string
  convertedByName: string
}) {
  return sendNotification({
    type:         'lead_converted',
    recipientIds,
    title:        'Lead convertido a oportunidad',
    body:         `${convertedByName} convirtió "${leadName}" → "${oppNombre}"`,
    href:         `/oportunidades/${oppId}`,
    payload:      { lead_id: leadId, lead_name: leadName, opp_id: oppId, opp_nombre: oppNombre },
    buildEmail:   async appUrl => ({
      subject: `🚀 Lead convertido: ${oppNombre} — Supply`,
      html:    await render(LeadConvertedEmail({
        leadName,
        oppNombre,
        convertedBy: convertedByName,
        oppUrl:      `${appUrl}/oportunidades/${oppId}`,
      })),
    }),
  })
}

export async function notifyOpportunityAssigned({
  recipientId,
  oppId,
  oppNombre,
  leadName,
  assignedByName,
}: {
  recipientId:    string
  oppId:          string
  oppNombre:      string
  leadName:       string
  assignedByName: string
}) {
  return sendNotification({
    type:         'opportunity_assigned',
    recipientIds: [recipientId],
    title:        'Se te asignó una nueva oportunidad',
    body:         `${assignedByName} te asignó "${leadName}" → "${oppNombre}"`,
    href:         `/oportunidades/${oppId}`,
    payload:      { opp_id: oppId, opp_nombre: oppNombre, lead_name: leadName },
    buildEmail:   async appUrl => ({
      subject: `📋 Nueva oportunidad: ${oppNombre} — Supply`,
      html:    await render(OpportunityAssignedEmail({
        oppNombre,
        leadName,
        assignedBy: assignedByName,
        oppUrl:     `${appUrl}/oportunidades/${oppId}`,
      })),
    }),
  })
}

export async function notifyOppClosed({
  recipientIds,
  oppId,
  oppNombre,
  etapa,
  vendedorName,
  moneda,
  montoFinal,
  montoFinalMxn,
}: {
  recipientIds:   string[]
  oppId:          string
  oppNombre:      string
  etapa:          'ganado' | 'perdido'
  vendedorName:   string
  moneda?:        'MXN' | 'USD'
  montoFinal?:    number
  montoFinalMxn?: number
}) {
  const isWon = etapa === 'ganado'
  return sendNotification({
    type:         isWon ? 'opp_ganada' : 'opp_perdida',
    recipientIds,
    title:        isWon ? '🎉 Oportunidad ganada' : '📉 Oportunidad perdida',
    body:         `${oppNombre} — ${vendedorName}`,
    href:         `/oportunidades/${oppId}`,
    payload:      { opp_id: oppId, opp_nombre: oppNombre, etapa, vendedor: vendedorName, monto: montoFinal },
    buildEmail:   async appUrl => ({
      subject: isWon
        ? `🎉 Oportunidad GANADA: ${oppNombre} — Supply`
        : `📉 Oportunidad PERDIDA: ${oppNombre} — Supply`,
      html: await render(OppClosedEmail({
        outcome:   etapa,
        oppNombre,
        vendedor:  vendedorName,
        moneda,
        monto:     montoFinal,
        montoMxn:  montoFinalMxn,
        oppUrl:    `${appUrl}/oportunidades/${oppId}`,
      })),
    }),
  })
}

export async function notifyITTicketAssigned({
  recipientId,
  ticketId,
  ticketTitle,
  requesterName,
}: {
  recipientId:    string
  ticketId:       string
  ticketTitle:    string
  requesterName:  string
}) {
  return sendNotification({
    type:         'it_ticket_assigned',
    recipientIds: [recipientId],
    title:        'Nuevo ticket de TI',
    body:         `${requesterName} levantó "${ticketTitle}"`,
    href:         `/soporte-ti/${ticketId}`,
    payload:      { ticket_id: ticketId, ticket_title: ticketTitle, requester_name: requesterName },
    buildEmail:   async appUrl => ({
      subject: `🎫 Nuevo ticket de TI: ${ticketTitle} — Supply`,
      html:    await render(ITTicketAssignedEmail({
        ticketTitle,
        requesterName,
        ticketUrl: `${appUrl}/soporte-ti/${ticketId}`,
      })),
    }),
  })
}

export async function notifyITTicketStatusChanged({
  recipientId,
  ticketId,
  ticketTitle,
  status,
  changedByName,
}: {
  recipientId:    string
  ticketId:       string
  ticketTitle:    string
  status:         ITTicketStatus
  changedByName:  string
}) {
  const statusLabel = IT_TICKET_STATUS_LABELS[status]
  return sendNotification({
    type:         'it_ticket_status_changed',
    recipientIds: [recipientId],
    title:        'Tu ticket de TI cambió de estado',
    body:         `"${ticketTitle}" → ${statusLabel}`,
    href:         `/soporte-ti/${ticketId}`,
    payload:      { ticket_id: ticketId, ticket_title: ticketTitle, status, changed_by: changedByName },
    buildEmail:   async appUrl => ({
      subject: `🔄 ${ticketTitle} → ${statusLabel} — Supply`,
      html:    await render(ITTicketActivityEmail({
        kind:        'status',
        ticketTitle,
        actorName:   changedByName,
        statusLabel,
        ticketUrl:   `${appUrl}/soporte-ti/${ticketId}`,
      })),
    }),
  })
}

export async function notifyITTicketMessage({
  recipientId,
  ticketId,
  ticketTitle,
  authorName,
}: {
  recipientId:  string
  ticketId:     string
  ticketTitle:  string
  authorName:   string
}) {
  return sendNotification({
    type:         'it_ticket_message',
    recipientIds: [recipientId],
    title:        'Nuevo mensaje en tu ticket de TI',
    body:         `${authorName} escribió en "${ticketTitle}"`,
    href:         `/soporte-ti/${ticketId}`,
    payload:      { ticket_id: ticketId, ticket_title: ticketTitle, author_name: authorName },
    buildEmail:   async appUrl => ({
      subject: `💬 Nuevo mensaje: ${ticketTitle} — Supply`,
      html:    await render(ITTicketActivityEmail({
        kind:       'message',
        ticketTitle,
        actorName:  authorName,
        ticketUrl:  `${appUrl}/soporte-ti/${ticketId}`,
      })),
    }),
  })
}

export async function notifyStaleDigest({
  recipientIds,
  opps,
}: {
  recipientIds: string[]
  opps: { nombre: string; owner: string; etapa: string }[]
}) {
  if (!opps.length) return
  return sendNotification({
    type:         'stale_digest',
    recipientIds,
    title:        `${opps.length} oportunidades sin actividad`,
    body:         `Llevan más de 7 días sin actividad: ${opps.slice(0, 3).map(o => o.nombre).join(', ')}${opps.length > 3 ? '…' : ''}`,
    href:         '/oportunidades',
    payload:      { count: opps.length, opp_names: opps.map(o => o.nombre) },
    buildEmail:   async () => ({
      subject: `⚠️ ${opps.length} oportunidades sin actividad — Supply`,
      html:    await render(StaleDigestEmail({ opps })),
    }),
  })
}
