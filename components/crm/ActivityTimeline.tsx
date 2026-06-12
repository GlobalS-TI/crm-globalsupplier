'use client'

import {
  Phone, Mail, Users, Monitor, FileText, RotateCcw, MoreHorizontal, CheckCircle2, Clock, XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { completeActivity, deleteActivity } from '@/app/(dashboard)/actividades/actions'
import type { ActivityRow } from '@/lib/repositories/interfaces/IActivityRepository'
import type { ActivityType, ActivityStatus } from '@/lib/validations/activity'

const TYPE_ICONS: Record<ActivityType, React.ElementType> = {
  llamada: Phone, email: Mail, reunion: Users, demo: Monitor,
  propuesta: FileText, seguimiento: RotateCcw, otro: MoreHorizontal,
}

const TYPE_LABELS: Record<ActivityType, string> = {
  llamada: 'Llamada', email: 'Email', reunion: 'Reunión', demo: 'Demo',
  propuesta: 'Propuesta', seguimiento: 'Seguimiento', otro: 'Otro',
}

const STATUS_CONFIG: Record<ActivityStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente:  { label: 'Pendiente',  variant: 'outline' },
  completada: { label: 'Completada', variant: 'secondary' },
  cancelada:  { label: 'Cancelada',  variant: 'destructive' },
}

interface ActivityTimelineProps {
  activities:    ActivityRow[]
  opportunityId: string
}

export function ActivityTimeline({ activities, opportunityId }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Sin actividades registradas.</p>
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-6">
      {activities.map(act => {
        const Icon       = TYPE_ICONS[act.tipo as ActivityType] ?? MoreHorizontal
        const fecha      = new Date(act.fecha)
        const isPending  = act.estatus === 'pendiente'
        const isOverdue  = isPending && fecha < new Date()
        const statusConf = STATUS_CONFIG[act.estatus as ActivityStatus]

        return (
          <li key={act.id} className="ml-6">
            {/* Icon dot */}
            <span className={`absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-background ${
              act.estatus === 'completada' ? 'bg-primary' :
              isOverdue                   ? 'bg-destructive' : 'bg-muted'
            }`}>
              {act.estatus === 'completada' ? (
                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
              ) : isOverdue ? (
                <Clock className="h-3 w-3 text-destructive-foreground" />
              ) : (
                <Icon className="h-3 w-3 text-muted-foreground" />
              )}
            </span>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABELS[act.tipo as ActivityType]}
                </span>
                <Badge variant={statusConf.variant} className="text-[10px] h-4 px-1.5">
                  {statusConf.label}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-[10px] h-4 px-1.5">Vencida</Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {fecha.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' '}
                  {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-sm font-medium">{act.titulo}</p>
              {act.descripcion && (
                <p className="text-sm text-muted-foreground">{act.descripcion}</p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                {isPending && (
                  <form action={completeActivity.bind(null, act.id, opportunityId)}>
                    <button type="submit" className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <CheckCircle2 className="h-3 w-3" /> Completar
                    </button>
                  </form>
                )}
                <form action={deleteActivity.bind(null, act.id, opportunityId)}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={e => { if (!confirm('¿Eliminar actividad?')) e.preventDefault() }}
                  >
                    <XCircle className="h-3 w-3" /> Eliminar
                  </button>
                </form>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
