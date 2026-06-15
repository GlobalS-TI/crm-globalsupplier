import Link from 'next/link'
import type { Route } from 'next'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StaleBadge } from '@/components/crm/StaleBadge'
import type { OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'
import type { OpportunityStage } from '@/lib/validations/opportunity'

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

const STAGE_LABELS: Record<OpportunityStage, string> = {
  nuevo_lead: 'Nuevo lead', contactado: 'Contactado', diagnostico: 'Diagnóstico',
  cotizacion_enviada: 'Cotización enviada', seguimiento: 'Seguimiento',
  negociacion: 'Negociación', ganado: 'Ganado', perdido: 'Perdido',
}

interface OpportunityTableProps {
  opportunities: OpportunityWithRelations[]
}

export function OpportunityTable({ opportunities }: OpportunityTableProps) {
  if (opportunities.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No hay oportunidades con estos filtros.
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead className="text-right">Monto estimado</TableHead>
            <TableHead className="text-right">Prob. %</TableHead>
            <TableHead>Próxima actividad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {opportunities.map(opp => {
            const isClosed = opp.etapa === 'ganado' || opp.etapa === 'perdido'
            const nextAt   = opp.next_activity_at ? new Date(opp.next_activity_at) : null
            const isOverdue = nextAt && nextAt < new Date() && !isClosed

            return (
              <TableRow key={opp.id}>
                <TableCell>
                  <Link
                    href={`/oportunidades/${opp.id}` as Route}
                    className="font-medium hover:underline"
                  >
                    {opp.nombre}
                  </Link>
                  {opp.stale && <span className="ml-2 inline-flex"><StaleBadge /></span>}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {opp.company?.nombre ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={isClosed ? 'secondary' : 'outline'} className="text-xs">
                    {STAGE_LABELS[opp.etapa as OpportunityStage]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {opp.owner?.full_name ?? '—'}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {opp.monto_estimado > 0 ? fmt.format(opp.monto_estimado) : '—'}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {opp.probabilidad}%
                </TableCell>
                <TableCell className={isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                  {nextAt
                    ? nextAt.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                    : '—'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
