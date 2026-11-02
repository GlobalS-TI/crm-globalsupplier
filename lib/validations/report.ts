import { z } from 'zod'
import { businessUnitSchema, opportunityStageSchema } from '@/lib/validations/opportunity'

// Estado comercial derivado de la etapa (no es una columna).
export const reportStatusSchema = z.enum(['abierta', 'ganada', 'perdida', 'sin_respuesta'])

// Alertas de seguimiento. Todas aplican sólo a oportunidades abiertas:
// - sin_seguimiento:      sin actividad pendiente (next_activity_at vacío)
// - seguimiento_vencido:  la actividad pendiente más próxima es de un día anterior a hoy
// - sin_actividad:        flag stale — 7+ días sin actividad registrada (ADR-002)
// - cotizacion_pendiente: cotización enviada que el cliente aún no confirma
export const reportAlertSchema = z.enum([
  'sin_seguimiento', 'seguimiento_vencido', 'sin_actividad', 'cotizacion_pendiente',
])

// Qué fecha filtra el rango desde/hasta: creación de la oportunidad o su cierre (closed_at).
export const reportDateFieldSchema = z.enum(['creacion', 'cierre'])

const dayKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(s => !Number.isNaN(Date.parse(s)))

// Los filtros llegan de la URL: un valor inválido se descarta en vez de romper la página.
export const opportunityReportFiltersSchema = z.object({
  fecha:  reportDateFieldSchema.default('creacion').catch('creacion'),
  desde:  dayKeySchema.optional().catch(undefined),
  hasta:  dayKeySchema.optional().catch(undefined),
  owner:  z.string().uuid().optional().catch(undefined),
  unit:   businessUnitSchema.optional().catch(undefined),
  stage:  opportunityStageSchema.optional().catch(undefined),
  estado: reportStatusSchema.optional().catch(undefined),
  alerta: reportAlertSchema.optional().catch(undefined),
})

export type ReportStatus             = z.infer<typeof reportStatusSchema>
export type ReportAlert              = z.infer<typeof reportAlertSchema>
export type ReportDateField          = z.infer<typeof reportDateFieldSchema>
export type OpportunityReportFilters = z.infer<typeof opportunityReportFiltersSchema>
