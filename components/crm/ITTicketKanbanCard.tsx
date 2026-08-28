'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ITTicketPriorityBadge } from '@/components/crm/ITTicketPriorityBadge'
import { BRAND_LABELS } from '@/lib/types'
import type { BusinessUnit } from '@/lib/types'
import type { ITTicketRow } from '@/lib/repositories/interfaces/IITTicketRepository'

interface Profile { id: string; full_name: string }

interface Props {
  ticket:       ITTicketRow
  profilesById: Record<string, Profile>
  draggable?:   boolean
}

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
}

export function ITTicketKanbanCard({ ticket, profilesById, draggable = true }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:       ticket.id,
    disabled: !draggable,
    data:     { status: ticket.status },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined

  const assignee = ticket.assignee_id ? profilesById[ticket.assignee_id] : undefined

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Link href={`/soporte-ti/${ticket.id}` as Route} draggable={false}>
        <Card className="rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
          <CardContent className="p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Badge variant="outline" className="text-xs">{BRAND_LABELS[ticket.brand as BusinessUnit]}</Badge>
              <ITTicketPriorityBadge priority={ticket.priority} />
            </div>

            <p className="text-sm font-semibold leading-snug line-clamp-2 select-none">{ticket.title}</p>

            <div className="flex items-center justify-between select-none">
              <span className="text-[11px] text-muted-foreground">Asignado</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[9px] font-medium">
                    {assignee ? initialsOf(assignee.full_name) : 'SA'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate">
                  {assignee?.full_name.split(' ')[0] ?? 'Sin asignar'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-2 text-xs select-none">
              <span className="text-muted-foreground">Creado</span>
              <span className="text-foreground font-medium">{formatShortDate(ticket.created_at)}</span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
