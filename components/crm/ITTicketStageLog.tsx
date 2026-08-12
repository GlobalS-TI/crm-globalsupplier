import { IT_TICKET_STATUS_LABELS } from '@/lib/types'
import type { ITTicketStageLogRow } from '@/lib/repositories/interfaces/IITTicketRepository'

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

interface Props {
  logs: ITTicketStageLogRow[]
}

export function ITTicketStageLog({ logs }: Props) {
  if (!logs.length) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historial de estados</h3>
      <ol className="relative border-l border-border space-y-4 pl-5">
        {logs.map(log => (
          <li key={log.id} className="relative">
            <span className="absolute -left-[1.1rem] flex h-3 w-3 items-center justify-center rounded-full bg-muted ring-2 ring-background">
              <span className="h-1 w-1 rounded-full bg-muted-foreground" />
            </span>
            <div className="space-y-0.5">
              <p className="text-sm">
                {log.from_status
                  ? <><span className="text-muted-foreground">{IT_TICKET_STATUS_LABELS[log.from_status]}</span>{' → '}</>
                  : null
                }
                <span className="font-medium">{IT_TICKET_STATUS_LABELS[log.to_status]}</span>
              </p>
              {log.comment && (
                <p className="text-xs text-muted-foreground italic">"{log.comment}"</p>
              )}
              <p className="text-xs text-muted-foreground">
                {log.changer?.full_name ?? 'Sistema'} · {dateFmt.format(new Date(log.changed_at))}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
