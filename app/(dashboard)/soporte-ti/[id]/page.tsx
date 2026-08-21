import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ITTicketService } from '@/lib/services/ITTicketService'
import { ITTicketRepository } from '@/lib/repositories/supabase/ITTicketRepository'
import { ProfileRepository } from '@/lib/repositories/supabase/ProfileRepository'
import { ITTicketStatusBadge } from '@/components/crm/ITTicketStatusBadge'
import { ITTicketPriorityBadge } from '@/components/crm/ITTicketPriorityBadge'
import { ITTicketPrioritySelect } from '@/components/crm/ITTicketPrioritySelect'
import { ITTicketStageTransition } from '@/components/crm/ITTicketStageTransition'
import { ITTicketFilesPanel } from '@/components/crm/ITTicketFilesPanel'
import { ITTicketMessagesFeed } from '@/components/crm/ITTicketMessagesFeed'
import { ITTicketStageLog } from '@/components/crm/ITTicketStageLog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { IT_STAFF_ROLES, BRAND_LABELS } from '@/lib/types'
import type { BusinessUnit, UserRole } from '@/lib/types'
import { setStatus, setPriority, addMessage, deleteITTicketFile } from '@/app/(dashboard)/soporte-ti/actions'

export const dynamic = 'force-dynamic'

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TicketDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [ticket, profileRes] = await Promise.all([
    new ITTicketService(new ITTicketRepository(), new ProfileRepository()).getTicketById(id),
    supabase.from('profiles').select('role, it_staff').eq('id', user.id).single(),
  ])

  if (!ticket) notFound()

  // Gate de UI únicamente — cambiar prioridad/estado está protegido de verdad
  // por la RLS de it_tickets (it_tickets_update exige is_it_staff()). it_staff
  // da acceso de gestión aunque el rol principal del perfil sea otro.
  const canManage = IT_STAFF_ROLES.includes((profileRes.data?.role ?? 'vendedor') as UserRole) || !!profileRes.data?.it_staff

  // Signed URLs para el panel de imágenes — el bucket es privado.
  const fileSignedUrls: Record<string, string> = {}
  if (ticket.files.length > 0) {
    const { data: signedData } = await supabase.storage
      .from('media')
      .createSignedUrls(ticket.files.map(f => f.file_path), 3600)
    signedData?.forEach((item, i) => {
      if (item.signedUrl) fileSignedUrls[ticket.files[i].id] = item.signedUrl
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <Link href={'/soporte-ti' as Route} className="text-sm text-muted-foreground hover:underline">
        ← Soporte TI
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{BRAND_LABELS[ticket.brand as BusinessUnit]}</Badge>
            <ITTicketStatusBadge status={ticket.status} />
            {canManage ? (
              <ITTicketPrioritySelect priority={ticket.priority} action={setPriority.bind(null, ticket.id)} />
            ) : (
              <ITTicketPriorityBadge priority={ticket.priority} />
            )}
          </div>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            <span>Solicitado por: <strong className="text-foreground">{ticket.requester?.full_name ?? '—'}</strong></span>
            <span>Asignado a: <strong className="text-foreground">{ticket.assignee?.full_name ?? 'Sin asignar'}</strong></span>
            <span>Creado: <strong className="text-foreground">{dateFmt.format(new Date(ticket.created_at))}</strong></span>
          </div>
        </div>

        {canManage && (
          <div className="shrink-0">
            <ITTicketStageTransition status={ticket.status} action={setStatus.bind(null, ticket.id)} />
          </div>
        )}
      </div>

      {ticket.description && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Descripción</h2>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
        </div>
      )}

      <Separator />

      {/* Imágenes */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Imágenes de referencia</h2>
        <ITTicketFilesPanel
          ticketId={ticket.id}
          files={ticket.files}
          signedUrls={fileSignedUrls}
          deleteAction={deleteITTicketFile.bind(null, ticket.id)}
        />
      </div>

      <Separator />

      {/* Chat */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Conversación</h2>
        <ITTicketMessagesFeed
          ticketId={ticket.id}
          messages={ticket.messages}
          action={addMessage.bind(null, ticket.id)}
        />
      </div>

      <Separator />

      <ITTicketStageLog logs={ticket.stage_logs} />
    </div>
  )
}
