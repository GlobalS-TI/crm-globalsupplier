import Link from 'next/link'
import type { Route } from 'next'
import { Badge } from '@/components/ui/badge'
import type { GlobalPendingActivity } from '@/lib/repositories/interfaces/IActivityRepository'

const TYPE_LABELS: Record<string, string> = {
  llamada:    'Llamada',
  email:      'Email',
  reunion:    'Reunión',
  demo:       'Demo',
  propuesta:  'Propuesta',
  seguimiento:'Seguimiento',
  otro:       'Otro',
}

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

interface Props {
  activities: GlobalPendingActivity[]
}

export function GlobalActivitiesPanel({ activities }: Props) {
  const now     = new Date()
  const overdue = activities.filter(a => new Date(a.fecha) < now)
  const upcoming = activities.filter(a => new Date(a.fecha) >= now)

  if (!activities.length) {
    return <p className="text-sm text-muted-foreground py-4">Sin actividades pendientes.</p>
  }

  return (
    <div className="space-y-6">
      {overdue.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-destructive mb-2">
            Vencidas ({overdue.length})
          </h3>
          <ActivityTable rows={overdue} overdue />
        </div>
      )}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2">
            Próximas ({upcoming.length})
          </h3>
          <ActivityTable rows={upcoming} />
        </div>
      )}
    </div>
  )
}

function ActivityTable({ rows, overdue = false }: { rows: GlobalPendingActivity[]; overdue?: boolean }) {
  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Actividad</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Oportunidad</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Responsable</th>
            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(a => (
            <tr key={a.id} className="border-t hover:bg-muted/30 transition-colors">
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs shrink-0">
                    {TYPE_LABELS[a.tipo] ?? a.tipo}
                  </Badge>
                  <span className={overdue ? 'text-destructive font-medium' : ''}>{a.titulo}</span>
                </div>
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {a.opportunity ? (
                  <Link
                    href={`/oportunidades/${a.opportunity.id}` as Route}
                    className="hover:underline text-foreground"
                  >
                    {a.opportunity.nombre}
                  </Link>
                ) : '—'}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {a.owner?.full_name ?? '—'}
              </td>
              <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                {dateFmt.format(new Date(a.fecha))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
