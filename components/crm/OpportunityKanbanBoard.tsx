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
import { KanbanReopenModal } from '@/components/crm/KanbanReopenModal'
import { GanadoTransitionModal } from '@/components/crm/GanadoTransitionModal'
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

const STAGE_DOT: Record<OpportunityStage, string> = {
  nuevo_lead:         'bg-sky-500',
  contactado:         'bg-emerald-500',
  diagnostico:        'bg-amber-500',
  cotizacion_enviada: 'bg-purple-500',
  seguimiento:        'bg-orange-500',
  negociacion:        'bg-pink-500',
  ganado:             'bg-green-600',
  perdido:            'bg-red-400',
}

const STAGE_BADGE: Record<OpportunityStage, string> = {
  nuevo_lead:         'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  contactado:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  diagnostico:        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  cotizacion_enviada: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  seguimiento:        'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  negociacion:        'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  ganado:             'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  perdido:            'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const CLOSED: Set<OpportunityStage> = new Set(['ganado', 'perdido'])

type PendingDrop = {
  card:        OpportunityWithRelations
  targetStage: 'ganado' | 'perdido'
}

type PendingReopen = {
  card:        OpportunityWithRelations
  sourceStage: 'ganado' | 'perdido'
  targetStage: OpportunityStage
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
      className={`flex flex-col shrink-0 w-72 rounded-xl overflow-hidden transition-colors ${
        isOver ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/40'
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className={`h-2 w-2 rounded-full shrink-0 ${STAGE_DOT[stage]}`} />
          {label}
        </span>
        <Badge variant="secondary" className={`text-xs font-semibold h-5 px-2 border-transparent ${STAGE_BADGE[stage]}`}>
          {cards.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1 px-2.5 pb-2.5">
        <div className="space-y-2.5">
          {cards.map(opp => (
            <OpportunityKanbanCard
              key={opp.id}
              opportunity={opp}
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
  const [pendingDrop, setPendingDrop]     = useState<PendingDrop | null>(null)
  const [pendingReopen, setPendingReopen] = useState<PendingReopen | null>(null)

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

    const sourceIsClosed = CLOSED.has(card.etapa)
    const targetIsClosed = CLOSED.has(targetStage)

    if (sourceIsClosed && targetIsClosed) return

    if (sourceIsClosed && !targetIsClosed) {
      setPendingReopen({ card, sourceStage: card.etapa as 'ganado' | 'perdido', targetStage })
      return
    }

    if (targetIsClosed) {
      setPendingDrop({ card, targetStage: targetStage as 'ganado' | 'perdido' })
      return
    }

    // Optimistic update (open → open)
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

  function handleReopenConfirm() {
    if (!pendingReopen) return
    const { card, targetStage } = pendingReopen
    setItems(prev =>
      prev.map(o => o.id === card.id ? { ...o, etapa: targetStage, monto_final: null } : o)
    )
    setPendingReopen(null)
  }

  function handleReopenCancel() {
    setPendingReopen(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className={`flex gap-4 h-full overflow-x-auto pb-4 px-6 transition-opacity ${pending ? 'opacity-80' : ''}`}>
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

      {pendingDrop && pendingDrop.targetStage === 'ganado' && (
        <GanadoTransitionModal
          open
          oppId={pendingDrop.card.id}
          oppName={pendingDrop.card.nombre}
          moneda={pendingDrop.card.moneda}
          cotizacionPath={pendingDrop.card.cotizacion_path}
          ordenCompraPath={pendingDrop.card.orden_compra_path}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}

      {pendingDrop && pendingDrop.targetStage === 'perdido' && (
        <KanbanStageModal
          open
          oppId={pendingDrop.card.id}
          oppName={pendingDrop.card.nombre}
          targetStage="perdido"
          moneda={pendingDrop.card.moneda}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
        />
      )}

      {pendingReopen && (
        <KanbanReopenModal
          open
          oppId={pendingReopen.card.id}
          oppName={pendingReopen.card.nombre}
          sourceStage={pendingReopen.sourceStage}
          targetStage={pendingReopen.targetStage}
          onConfirm={handleReopenConfirm}
          onCancel={handleReopenCancel}
        />
      )}
    </>
  )
}
