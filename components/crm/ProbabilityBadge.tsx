import { cn } from '@/lib/utils'

const TIER_STYLES = {
  baja:  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  media: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  alta:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
} as const

type Tier = keyof typeof TIER_STYLES

function resolveTier(probabilidad: number): Tier {
  if (probabilidad < 34) return 'baja'
  if (probabilidad < 67) return 'media'
  return 'alta'
}

interface Props {
  probabilidad: number
  className?:   string
}

// Usa `probabilidad` (probabilidad de cierre, ya existente en el schema) como
// señal de prioridad visual — el CRM no tiene un campo `prioridad` separado.
export function ProbabilityBadge({ probabilidad, className }: Props) {
  const tier = resolveTier(probabilidad)

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold shrink-0',
      TIER_STYLES[tier],
      className,
    )}>
      {probabilidad}%
    </span>
  )
}
