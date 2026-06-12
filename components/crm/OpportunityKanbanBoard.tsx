import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { OpportunityKanbanCard } from '@/components/crm/OpportunityKanbanCard'
import type { OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'
import type { OpportunityStage } from '@/lib/validations/opportunity'

const COLUMNS: { stage: OpportunityStage; label: string }[] = [
  { stage: 'nuevo_lead',         label: 'Nuevo lead' },
  { stage: 'contactado',         label: 'Contactado' },
  { stage: 'diagnostico',        label: 'Diagnóstico' },
  { stage: 'cotizacion_enviada', label: 'Cotización enviada' },
  { stage: 'seguimiento',        label: 'Seguimiento' },
  { stage: 'negociacion',        label: 'Negociación' },
  { stage: 'ganado',             label: 'Ganado' },
  { stage: 'perdido',            label: 'Perdido' },
]

interface OpportunityKanbanBoardProps {
  opportunities: OpportunityWithRelations[]
}

export function OpportunityKanbanBoard({ opportunities }: OpportunityKanbanBoardProps) {
  const byStage = Object.fromEntries(
    COLUMNS.map(({ stage }) => [
      stage,
      opportunities.filter(o => o.etapa === stage),
    ])
  ) as Record<OpportunityStage, OpportunityWithRelations[]>

  return (
    <div className="flex gap-3 h-full overflow-x-auto pb-4 px-6">
      {COLUMNS.map(({ stage, label }) => {
        const cards = byStage[stage]
        const isClosed = stage === 'ganado' || stage === 'perdido'
        return (
          <div
            key={stage}
            className="flex flex-col shrink-0 w-60 rounded-lg bg-muted/50"
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-2.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <Badge variant="secondary" className="text-xs h-5 px-1.5">
                {cards.length}
              </Badge>
            </div>

            {/* Cards */}
            <ScrollArea className="flex-1 px-2 pb-2">
              <div className="space-y-2">
                {cards.map(opp => (
                  <OpportunityKanbanCard key={opp.id} opportunity={opp} />
                ))}
                {cards.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">
                    {isClosed ? '—' : 'Sin oportunidades'}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        )
      })}
    </div>
  )
}
