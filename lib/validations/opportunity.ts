import { z } from 'zod'

// ----------------------------------------------------------------
// Enums (source of truth per ADR-004 — mirrors DB enums)
// ----------------------------------------------------------------
export const opportunityStageSchema = z.enum([
  'nuevo_lead', 'contactado', 'diagnostico', 'cotizacion_enviada',
  'seguimiento', 'negociacion', 'ganado', 'perdido',
])

export const leadSourceSchema = z.enum([
  'referido', 'web', 'linkedin', 'llamada_en_frio', 'evento', 'alianza', 'otro',
])

export const businessUnitSchema = z.enum([
  'global_supplier_mty', 'thunder_safety', 'thunder_led', 'got_fresh_breath',
  'gtx_systems', 'juno_promotional', 'fire_spot',
])

// ----------------------------------------------------------------
// Create — business rules enforced here and in OpportunityService
// ----------------------------------------------------------------
export const createOpportunitySchema = z.object({
  nombre:               z.string().min(1).max(255),
  business_unit:        businessUnitSchema,
  fuente:               leadSourceSchema,
  owner_id:             z.string().uuid(),
  company_id:           z.string().uuid().optional(),
  contact_id:           z.string().uuid().optional(),
  etapa:                opportunityStageSchema.default('nuevo_lead'),
  monto_estimado:       z.number().min(0).default(0),
  monto_final:          z.number().min(0).optional(),
  probabilidad:         z.number().int().min(0).max(100).default(0),
  fecha_cierre_estimada: z.string().date().optional(),
  next_activity_at:     z.string().datetime({ offset: true }).optional(),
  notas:                z.string().max(2000).optional(),
})
// Service enforces: next_activity_at required for open stages (rule 3)
// Service enforces: monto_final > 0 when etapa = ganado (rule 2)

// ----------------------------------------------------------------
// Update — all fields optional; service re-applies business rules
// ----------------------------------------------------------------
export const updateOpportunitySchema = createOpportunitySchema
  .omit({ owner_id: true })
  .partial()

// ----------------------------------------------------------------
// Stage transition — used by Kanban move action
// ----------------------------------------------------------------
export const stageTransitionSchema = z.object({
  etapa:       opportunityStageSchema,
  monto_final: z.number().min(0).optional(),
}).refine(
  (d) => d.etapa !== 'ganado' || (d.monto_final !== undefined && d.monto_final > 0),
  { message: 'monto_final must be > 0 when moving to ganado', path: ['monto_final'] }
)

// ----------------------------------------------------------------
// Inferred types (imported by services, components, and server actions)
// ----------------------------------------------------------------
export type CreateOpportunityInput = z.infer<typeof createOpportunitySchema>
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>
export type StageTransitionInput   = z.infer<typeof stageTransitionSchema>
export type OpportunityStage       = z.infer<typeof opportunityStageSchema>
export type LeadSource             = z.infer<typeof leadSourceSchema>
export type BusinessUnit           = z.infer<typeof businessUnitSchema>
