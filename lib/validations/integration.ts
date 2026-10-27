import { z } from 'zod'
import { createCompanySchema } from './company'
import { createContactSchema } from './contact'
import { createOpportunitySchema, opportunityStageSchema, updateOpportunitySchema } from './opportunity'
import { activityStatusSchema, createActivitySchema, updateActivitySchema } from './activity'

// ----------------------------------------------------------------
// Esquemas de la API de integración (ADR-007). Derivan de los de la app (ADR-004);
// sólo quitan lo que una integración no decide (dueño, unidad, fuente, cierre).
// La DB (funciones integration_*) es la fuente de verdad de permisos: estos
// esquemas sólo dan errores tempranos y claros a quien llama.
// ----------------------------------------------------------------

// ganado / perdido / sin_respuesta quedan reservadas para personas
export const integrationStageSchema = z.enum([
  'nuevo_lead', 'contactado', 'diagnostico', 'cotizacion_enviada', 'seguimiento', 'negociacion',
])

export const integrationIdSchema = z.string().uuid()

export const integrationLookupSchema = z.object({
  rfc:      z.string().trim().min(12).max(13).optional(),
  email:    z.string().trim().email().optional(),
  telefono: z.string().trim()
    .refine((v) => v.replace(/\D/g, '').length >= 10, 'Se requieren al menos 10 dígitos')
    .optional(),
}).refine((d) => d.rfc || d.email || d.telefono, { message: 'Se requiere rfc, email o telefono' })

export const integrationCreateCompanySchema = createCompanySchema
export const integrationCreateContactSchema = createContactSchema

const opportunityBase = createOpportunitySchema.innerType()

export const integrationCreateOpportunitySchema = opportunityBase
  .omit({
    owner_id: true, business_unit: true, fuente: true, monto_final: true, tipo_cambio_final: true,
  })
  .extend({
    etapa:            integrationStageSchema.default('nuevo_lead'),
    // Regla 3 (lib/CLAUDE.md): todas las etapas permitidas son abiertas → siempre requerido
    next_activity_at: opportunityBase.shape.next_activity_at.unwrap(),
  })
  .superRefine((d, ctx) => {
    if (d.moneda === 'USD' && d.tipo_cambio_estimado === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['tipo_cambio_estimado'],
        message: 'tipo_cambio_estimado es requerido cuando la moneda es USD',
      })
    }
  })

export const integrationUpdateOpportunitySchema = updateOpportunitySchema
  .pick({
    nombre: true, moneda: true, monto_estimado: true, tipo_cambio_estimado: true,
    probabilidad: true, next_activity_at: true,
  })
  .extend({
    etapa:                 integrationStageSchema.optional(),
    company_id:            z.string().uuid().nullable().optional(),
    contact_id:            z.string().uuid().nullable().optional(),
    fecha_cierre_estimada: z.string().date().nullable().optional(),
    notas:                 z.string().max(2000).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'Sin campos para actualizar' })

export const integrationListOpportunitiesSchema = z.object({
  etapa: opportunityStageSchema.optional(),
})

export const integrationCreateActivitySchema = createActivitySchema.extend({
  estatus: activityStatusSchema.exclude(['cancelada']).default('pendiente'),
})

export const integrationUpdateActivitySchema = updateActivitySchema
  .omit({ completed_at: true })
  .refine((d) => Object.keys(d).length > 0, { message: 'Sin campos para actualizar' })

export type IntegrationLookupInput            = z.infer<typeof integrationLookupSchema>
export type IntegrationCreateCompanyInput     = z.infer<typeof integrationCreateCompanySchema>
export type IntegrationCreateContactInput     = z.infer<typeof integrationCreateContactSchema>
export type IntegrationCreateOpportunityInput = z.infer<typeof integrationCreateOpportunitySchema>
export type IntegrationUpdateOpportunityInput = z.infer<typeof integrationUpdateOpportunitySchema>
export type IntegrationListOpportunitiesInput = z.infer<typeof integrationListOpportunitiesSchema>
export type IntegrationCreateActivityInput    = z.infer<typeof integrationCreateActivitySchema>
export type IntegrationUpdateActivityInput    = z.infer<typeof integrationUpdateActivitySchema>
