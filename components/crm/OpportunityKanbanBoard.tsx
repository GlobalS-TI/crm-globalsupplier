'use client'

import { useState, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
} from '@dnd-kit/core'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { OpportunityKanbanCard } from '@/components/crm/OpportunityKanbanCard'
import { KanbanStageModal } from '@/components/crm/KanbanStageModal'
import { kanbanMoveToStage } from '@/app/(dashboard)/oportunidades/actions'
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

const CLOSED: Set<OpportunityStage> = new Set(['ganado', 'perdido'])

type PendingDrop = {
  card:        OpportunityWithRelations
  targetStage: 'ganado' | 'perdido'
}

interface Props {
  opportunities: OpportunityWithRelations[]
}

function KanbanColumn({
  stage, label, cards, isOver,
}: {
  stage:   OpportunityStage
  label:   string
  cards:   OpportunityWithRelations[]
  isOver:  boolean
}) {
  const { setNodeRef } = useDroppable({ id: stage })
  const isClosed = CLOSED.has(stage)

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col shrink-0 w-60 rounded-lg transition-colors ${
        isOver ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/50'
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Badge variant="secondary" className="text-xs h-5 px-1.5">
          {cards.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1 px-2 pb-2">
        <div className="space-y-2">
          {cards.map(opp => (
            <OpportunityKanbanCard
              key={opp.id}
              opportunity={opp}
              draggable={!isClosed}
            />
          ))}
          {cards.length === 0 && (
            <p className={`text-xs text-center py-6 transition-colors ${
              isOver ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {isClosed ? '—' : isOver ? 'Soltar aquí' : 'Sin oportunidades'}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export function OpportunityKanbanBoard({ opportunities }: Props) {
  const [items, setItems] = useState<OpportunityWithRelations[]>(opportunities)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId]     = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement before activating drag — keeps link clicks working
      activationConstraint: { distance: 8 },
    })
  )

  const byStage = Object.fromEntries(
    COLUMNS.map(({ stage }) => [stage, items.filter(o => o.etapa === stage)])
  ) as Record<OpportunityStage, OpportunityWithRelations[]>

  const activeCard = activeId ? items.find(o => o.id === activeId) ?? null : null

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string)
  }

  function handleDragOver({ over }: DragOverEvent) {
    setOverId(over ? String(over.id) : null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    setOverId(null)
    if (!over) return

    const oppId      = active.id as string
    const targetStage = over.id as OpportunityStage
    const card        = items.find(o => o.id === oppId)
    if (!card || card.etapa === targetStage) return

    if (CLOSED.has(targetStage)) {
      setPendingDrop({ card, targetStage: targetStage as 'ganado' | 'perdido' })
      return
    }

    // Optimistic update
    setItems(prev =>
      prev.map(o => o.id === oppId ? { ...o, etapa: targetStage } : o)
    )

    startTransition(async () => {
      const result = await kanbanMoveToStage(oppId, targetStage)
      if (result.error) {
        // Revert on failure
        setItems(prev =>
          prev.map(o => o.id === oppId ? { ...o, etapa: card.etapa } : o)
        )
      }
    })
  }

  function handleModalConfirm() {
    if (!pendingDrop) return
    const { card, targetStage } = pendingDrop
    setItems(prev =>
      prev.map(o => o.id === card.id ? { ...o, etapa: targetStage } : o)
    )
    setPendingDrop(null)
  }

  function handleModalCancel() {
    setPendingDrop(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex gap-3 h-full overflow-x-auto pb-4 px-6 transition-opacity ${pending ? 'opacity-80' : ''}`}>
          {COLUMNS.map(({ stage, label }) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              label={label}
              cards={byStage[stage]}
              isOver={overId === stage && !CLOSED.has(stage)}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard && (
            <div className="rotate-2 scale-105 opacity-95 shadow-xl">
              <OpportunityKanbanCard opportunity={activeCard} draggable={false} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {pendingDrop && (
        <KanbanStageModal
          open
          oppId={pendingDrop.card.id}
          oppName={pendingDrop.card.nombre}
          targetStage={pendingDrop.targetStage}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}
    </>
  )
}
