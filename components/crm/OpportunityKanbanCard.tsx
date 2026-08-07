'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { StaleBadge } from '@/components/crm/StaleBadge'
import { BRAND_COLORS } from '@/lib/types'
import { formatDualCurrency } from '@/lib/utils/currency'
import type { OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'

interface OpportunityKanbanCardProps {
  opportunity: OpportunityWithRelations
  draggable?:  boolean  // false only for the DragOverlay ghost
}

export function OpportunityKanbanCard({ opportunity: opp, draggable = true }: OpportunityKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:       opp.id,
    disabled: !draggable,
    data:     { stage: opp.etapa },
  })

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }
    : undefined

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Link href={`/oportunidades/${opp.id}` as Route} draggable={false}>
        <Card
          className="cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-l-4"
          style={{ borderLeftColor: BRAND_COLORS[opp.business_unit] }}
        >
          <CardContent className="p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium leading-tight line-clamp-2 select-none">{opp.nombre}</p>
              {opp.stale && <StaleBadge />}
            </div>

            {opp.company && (
              <p className="text-xs text-muted-foreground truncate select-none">{opp.company.nombre}</p>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="select-none">{opp.owner?.full_name.split(' ')[0] ?? '—'}</span>
              {opp.monto_estimado > 0 && (
                <span className="font-medium text-foreground select-none">
                  {formatDualCurrency(opp.monto_estimado, opp.moneda, opp.monto_estimado_mxn ?? opp.monto_estimado)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
