import { cn } from '@/lib/utils'
import { IT_TICKET_STATUS_LABELS } from '@/lib/types'
import type { ITTicketStatus } from '@/lib/types'

const STATUS_STYLES: Record<ITTicketStatus, string> = {
  abierto:    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  en_proceso: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  qa_ready:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  prod_ready: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  resuelto:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  cancelado:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

interface Props {
  status: ITTicketStatus
  className?: string
}

export function ITTicketStatusBadge({ status, className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      STATUS_STYLES[status],
      className,
    )}>
      {IT_TICKET_STATUS_LABELS[status]}
    </span>
  )
}
