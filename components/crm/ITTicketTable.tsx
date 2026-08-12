import Link from 'next/link'
import type { Route } from 'next'
import { Badge } from '@/components/ui/badge'
import { ITTicketStatusBadge } from '@/components/crm/ITTicketStatusBadge'
import { ITTicketPriorityBadge } from '@/components/crm/ITTicketPriorityBadge'
import { BRAND_LABELS } from '@/lib/types'
import type { BusinessUnit } from '@/lib/types'
import type { ITTicketRow } from '@/lib/repositories/interfaces/IITTicketRepository'

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

interface Profile { id: string; full_name: string }

interface Props {
  tickets:        ITTicketRow[]
  profilesById:   Record<string, Profile>
  showRequester?: boolean
  showAssignee?:  boolean
  emptyMessage?:  string
}

export function ITTicketTable({ tickets, profilesById, showRequester, showAssignee, emptyMessage }: Props) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground text-sm">
        {emptyMessage ?? 'Sin tickets registrados.'}
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ticket</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Marca</th>
            {showRequester && <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Solicitante</th>}
            {showAssignee  && <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Asignado</th>}
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Prioridad</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Creado</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t, i) => (
            <tr key={t.id} className="group border-t hover:bg-muted/30 transition-colors animate-fade-up" style={{ '--stagger': `${i * 30}ms` } as React.CSSProperties}>
              <td className="px-4 py-3">
                <Link href={`/soporte-ti/${t.id}` as Route} className="font-medium hover:underline">
                  {t.title}
                </Link>
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                <Badge variant="outline" className="text-xs">{BRAND_LABELS[t.brand as BusinessUnit]}</Badge>
              </td>
              {showRequester && (
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {profilesById[t.requester_id]?.full_name ?? '—'}
                </td>
              )}
              {showAssignee && (
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {t.assignee_id ? profilesById[t.assignee_id]?.full_name ?? '—' : '— Sin asignar —'}
                </td>
              )}
              <td className="px-4 py-3">
                <ITTicketPriorityBadge priority={t.priority} />
              </td>
              <td className="px-4 py-3">
                <ITTicketStatusBadge status={t.status} />
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                {dateFmt.format(new Date(t.created_at))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
