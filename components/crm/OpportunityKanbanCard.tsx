import Link from 'next/link'
import type { Route } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { StaleBadge } from '@/components/crm/StaleBadge'
import type { OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

interface OpportunityKanbanCardProps {
  opportunity: OpportunityWithRelations
}

export function OpportunityKanbanCard({ opportunity: opp }: OpportunityKanbanCardProps) {
  return (
    <Link href={`/oportunidades/${opp.id}` as Route}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-3 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium leading-tight line-clamp-2">{opp.nombre}</p>
            {opp.stale && <StaleBadge />}
          </div>

          {opp.company && (
            <p className="text-xs text-muted-foreground truncate">{opp.company.nombre}</p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{opp.owner.full_name.split(' ')[0]}</span>
            {opp.monto_estimado > 0 && (
              <span className="font-medium text-foreground">{fmt.format(opp.monto_estimado)}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
