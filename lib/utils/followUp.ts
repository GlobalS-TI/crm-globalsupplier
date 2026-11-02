import { businessDayKey } from '@/lib/utils/date'

// Estado de la próxima actividad de una oportunidad (next_activity_at). No confundir con
// el flag `stale` (ADR-002), que mira hacia atrás (días sin actividad) en vez de adelante.
export type FollowUpStatus = 'vencida' | 'hoy' | 'programada' | 'sin_seguimiento'

export const FOLLOW_UP_LABELS: Record<FollowUpStatus, string> = {
  vencida:         'Vencida',
  hoy:             'Hoy',
  programada:      'Programada',
  sin_seguimiento: 'Sin seguimiento',
}

// Compara por día calendario del negocio, no por instante: una actividad de hoy a las
// 9:00 sigue siendo "Hoy" a las 18:00, no "Vencida".
export function resolveFollowUpStatus(nextActivityAt: string | null, now: Date = new Date()): FollowUpStatus {
  if (!nextActivityAt) return 'sin_seguimiento'

  const targetKey = businessDayKey(new Date(nextActivityAt))
  const todayKey  = businessDayKey(now)

  if (targetKey < todayKey) return 'vencida'
  if (targetKey === todayKey) return 'hoy'
  return 'programada'
}
