import { cn } from '@/lib/utils'
import { IT_TICKET_PRIORITY_LABELS } from '@/lib/types'
import type { ITTicketPriority } from '@/lib/types'

const PRIORITY_STYLES: Record<ITTicketPriority, string> = {
  bajo:    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  medio:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  alto:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  urgente: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

interface Props {
  priority: ITTicketPriority
  className?: string
}

export function ITTicketPriorityBadge({ priority, className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      PRIORITY_STYLES[priority],
      className,
    )}>
      {IT_TICKET_PRIORITY_LABELS[priority]}
    </span>
  )
}
