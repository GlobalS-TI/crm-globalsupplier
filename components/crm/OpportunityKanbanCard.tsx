'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { Flag } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StaleBadge } from '@/components/crm/StaleBadge'
import { ActivityStatusBadge } from '@/components/crm/ActivityStatusBadge'
import { formatDualCurrency } from '@/lib/utils/currency'
import type { OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'

interface OpportunityKanbanCardProps {
  opportunity: OpportunityWithRelations
  draggable?:  boolean  // false only for the DragOverlay ghost
}

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

// timeZone explícito: sin esto, el string sale distinto en el render del servidor
// (Vercel corre en UTC) vs. la hidratación en el navegador (hora local de México),
// lo que se ve como si la fecha "cambiara sola" al cargar la tarjeta.
function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', timeZone: 'America/Mexico_City' })
}

function formatRelativeActivity(iso: string): string {
  const diffMs   = Date.now() - new Date(iso).getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Actividad hoy'
  if (diffDays === 1) return 'Hace 1 día'
  return `Hace ${diffDays} días`
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

  // Ganado/perdido muestran el monto final (lo capturado al cerrar) — el estimado suele
  // no llenarse nunca en esos casos, y antes la card se quedaba mostrando "—" aunque el
  // monto final sí estuviera guardado.
  const isClosed = opp.etapa === 'ganado' || opp.etapa === 'perdido'
  const amount    = isClosed ? opp.monto_final    : opp.monto_estimado
  const amountMxn = isClosed ? opp.monto_final_mxn : opp.monto_estimado_mxn

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Link href={`/oportunidades/${opp.id}` as Route} draggable={false}>
        <Card
          className="rounded-xl cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
        >
          <CardContent className="p-3.5 space-y-3">
            {/* Estado de la actividad + alerta de inactividad */}
            <div className="flex items-center justify-between gap-2">
              <ActivityStatusBadge nextActivityAt={opp.next_activity_at} />
              {opp.stale && <StaleBadge />}
            </div>

            {/* Título */}
            <p className="text-sm font-semibold leading-snug line-clamp-2 select-none">{opp.nombre}</p>

            {/* Empresa (línea tipo "descripción") */}
            {opp.company && (
              <p className="text-xs text-muted-foreground truncate select-none">{opp.company.nombre}</p>
            )}

            {/* Responsable */}
            <div className="flex items-center justify-between select-none">
              <span className="text-[11px] text-muted-foreground">Responsable</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[9px] font-medium">
                    {opp.owner ? initialsOf(opp.owner.full_name) : '—'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate">
                  {opp.owner?.full_name.split(' ')[0] ?? '—'}
                </span>
              </div>
            </div>

            {/* Próxima actividad */}
            <div className="flex items-center select-none">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flag className="h-3 w-3" />
                {opp.next_activity_at ? formatShortDate(opp.next_activity_at) : 'Sin fecha'}
              </span>
            </div>

            {/* Footer: monto + última actividad */}
            <div className="flex items-center justify-between gap-2 border-t pt-2 text-xs select-none">
              <span className="font-medium text-foreground truncate">
                {amount && amount > 0
                  ? formatDualCurrency(amount, opp.moneda, amountMxn ?? amount)
                  : '—'}
              </span>
              <span className="text-muted-foreground shrink-0">
                {formatRelativeActivity(opp.last_activity_at)}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
