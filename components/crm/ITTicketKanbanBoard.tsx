'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { ITTicketKanbanCard } from '@/components/crm/ITTicketKanbanCard'
import { ITTicketCloseModal } from '@/components/crm/ITTicketCloseModal'
import { kanbanMoveToStatus } from '@/app/(dashboard)/soporte-ti/actions'
import { IT_TICKET_STATUSES, IT_TICKET_STATUS_LABELS, IT_TICKET_TERMINAL_STATUSES } from '@/lib/types'
import type { ITTicketStatus } from '@/lib/types'
import type { ITTicketRow } from '@/lib/repositories/interfaces/IITTicketRepository'

interface Profile { id: string; full_name: string }

const STATUS_DOT: Record<ITTicketStatus, string> = {
  abierto:    'bg-slate-500',
  en_proceso: 'bg-blue-500',
  qa_ready:   'bg-yellow-500',
  prod_ready: 'bg-purple-500',
  resuelto:   'bg-emerald-500',
  cancelado:  'bg-rose-500',
}

const STATUS_BADGE: Record<ITTicketStatus, string> = {
  abierto:    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  en_proceso: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  qa_ready:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  prod_ready: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  resuelto:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelado:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

function isTerminal(status: ITTicketStatus): boolean {
  return IT_TICKET_TERMINAL_STATUSES.includes(status)
}

type PendingClose = { ticket: ITTicketRow; targetStatus: ITTicketStatus }

interface Props {
  tickets:      ITTicketRow[]
  profilesById: Record<string, Profile>
}

function KanbanColumn({
  status, label, cards, profilesById, isOver,
}: {
  status:       ITTicketStatus
  label:        string
  cards:        ITTicketRow[]
  profilesById: Record<string, Profile>
  isOver:       boolean
}) {
  const { setNodeRef } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col shrink-0 snap-start w-[calc(100vw-3rem)] md:w-72 rounded-xl overflow-hidden transition-colors ${
        isOver ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-muted/40'
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-3">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
          {label}
        </span>
        <Badge variant="secondary" className={`text-xs font-semibold h-5 px-2 border-transparent ${STATUS_BADGE[status]}`}>
          {cards.length}
        </Badge>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden px-2.5 pb-2.5">
        <div className="space-y-2.5">
          {cards.map(ticket => (
            <ITTicketKanbanCard
              key={ticket.id}
              ticket={ticket}
              profilesById={profilesById}
              draggable={!isTerminal(ticket.status)}
            />
          ))}
          {cards.length === 0 && (
            <p className={`text-xs text-center py-6 transition-colors ${
              isOver ? 'text-primary' : 'text-muted-foreground'
            }`}>
              {isOver ? 'Soltar aquí' : 'Sin tickets'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ITTicketKanbanBoard({ tickets, profilesById }: Props) {
  const [items, setItems] = useState<ITTicketRow[]>(tickets)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId]     = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [pendingClose, setPendingClose] = useState<PendingClose | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement before activating drag — keeps link clicks working
      activationConstraint: { distance: 8 },
    })
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft]   = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollFades = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollFades()
    window.addEventListener('resize', updateScrollFades)
    return () => window.removeEventListener('resize', updateScrollFades)
  }, [updateScrollFades, items])

  const byStatus = Object.fromEntries(
    IT_TICKET_STATUSES.map(status => [status, items.filter(t => t.status === status)])
  ) as Record<ITTicketStatus, ITTicketRow[]>

  const activeCard = activeId ? items.find(t => t.id === activeId) ?? null : null

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

    const ticketId     = active.id as string
    const targetStatus = over.id as ITTicketStatus
    const ticket        = items.find(t => t.id === ticketId)
    if (!ticket || ticket.status === targetStatus) return

    if (isTerminal(targetStatus)) {
      setPendingClose({ ticket, targetStatus })
      return
    }

    const previousStatus = ticket.status

    // Optimistic update
    setItems(prev =>
      prev.map(t => t.id === ticketId ? { ...t, status: targetStatus } : t)
    )

    startTransition(async () => {
      const result = await kanbanMoveToStatus(ticketId, targetStatus)
      if (result.error) {
        // Revert on failure
        setItems(prev =>
          prev.map(t => t.id === ticketId ? { ...t, status: previousStatus } : t)
        )
      }
    })
  }

  function handleCloseConfirm() {
    if (!pendingClose) return
    const { ticket, targetStatus } = pendingClose
    setItems(prev =>
      prev.map(t => t.id === ticket.id ? { ...t, status: targetStatus } : t)
    )
    setPendingClose(null)
  }

  function handleCloseCancel() {
    setPendingClose(null)
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="relative h-full">
          <div
            ref={scrollRef}
            onScroll={updateScrollFades}
            className={`flex gap-4 h-full overflow-x-auto snap-x snap-mandatory pb-4 px-6 transition-opacity ${pending ? 'opacity-80' : ''}`}
          >
            {IT_TICKET_STATUSES.map(status => (
              <KanbanColumn
                key={status}
                status={status}
                label={IT_TICKET_STATUS_LABELS[status]}
                cards={byStatus[status]}
                profilesById={profilesById}
                isOver={overId === status}
              />
            ))}
          </div>

          {/* Degradados que insinúan que hay más columnas para scrollear */}
          <div className={`pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />
        </div>

        <DragOverlay dropAnimation={null}>
          {activeCard && (
            <div className="rotate-2 scale-105 opacity-95 shadow-xl">
              <ITTicketKanbanCard ticket={activeCard} profilesById={profilesById} draggable={false} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {pendingClose && (
        <ITTicketCloseModal
          open
          ticketId={pendingClose.ticket.id}
          ticketTitle={pendingClose.ticket.title}
          targetStatus={pendingClose.targetStatus}
          onConfirm={handleCloseConfirm}
          onCancel={handleCloseCancel}
        />
      )}
    </>
  )
}
