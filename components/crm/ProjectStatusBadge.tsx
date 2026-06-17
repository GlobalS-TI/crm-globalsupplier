import { cn } from '@/lib/utils'
import { PROJECT_STATUS_LABELS } from '@/lib/types'
import type { ProjectStatus } from '@/lib/types'

const STATUS_STYLES: Record<ProjectStatus, string> = {
  INCOMING:    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  ANALYSIS:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  DESIGN:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  DEVELOPMENT: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  QA:          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  DELIVERED:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

interface Props {
  status: ProjectStatus
  className?: string
}

export function ProjectStatusBadge({ status, className }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
      STATUS_STYLES[status],
      className,
    )}>
      {PROJECT_STATUS_LABELS[status]}
    </span>
  )
}
