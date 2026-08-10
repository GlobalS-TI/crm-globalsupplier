import { cn } from '@/lib/utils'

const STATUS_LABELS = {
  vencida:          'Vencida',
  hoy:              'Hoy',
  programada:       'Programada',
  sin_seguimiento:  'Sin seguimiento',
} as const

const STATUS_STYLES = {
  vencida:          'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  hoy:              'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  programada:       'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  sin_seguimiento:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
} as const

const STATUS_DOTS = {
  vencida:          'bg-red-500',
  hoy:              'bg-amber-500',
  programada:       'bg-indigo-500',
  sin_seguimiento:  'bg-slate-400',
} as const

type ActivityStatus = keyof typeof STATUS_LABELS

function resolveStatus(nextActivityAt: string | null): ActivityStatus {
  if (!nextActivityAt) return 'sin_seguimiento'

  const target = new Date(nextActivityAt)
  const now = new Date()
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (startOfTarget.getTime() < startOfToday.getTime()) return 'vencida'
  if (startOfTarget.getTime() === startOfToday.getTime()) return 'hoy'
  return 'programada'
}

interface Props {
  nextActivityAt: string | null
  className?:     string
}

// Estado de la próxima actividad de la oportunidad (next_activity_at), no confundir
// con el flag `stale` (StaleBadge), que mira hacia atrás en vez de hacia adelante.
export function ActivityStatusBadge({ nextActivityAt, className }: Props) {
  const status = resolveStatus(nextActivityAt)

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0',
      STATUS_STYLES[status],
      className,
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOTS[status])} />
      {STATUS_LABELS[status]}
    </span>
  )
}
