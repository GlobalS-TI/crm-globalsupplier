import { z } from 'zod'

export const activityTypeSchema = z.enum([
  'llamada', 'email', 'reunion', 'demo', 'propuesta', 'seguimiento', 'otro',
])

export const activityStatusSchema = z.enum(['pendiente', 'completada', 'cancelada'])

export const createActivitySchema = z.object({
  opportunity_id: z.string().uuid(),
  tipo:           activityTypeSchema,
  titulo:         z.string().min(1).max(255),
  descripcion:    z.string().max(2000).optional(),
  fecha:          z.string().datetime({ offset: true }),
})

export const updateActivitySchema = createActivitySchema
  .omit({ opportunity_id: true })
  .partial()
  .extend({
    estatus:      activityStatusSchema.optional(),
    completed_at: z.string().datetime({ offset: true }).nullable().optional(),
  })

export const completeActivitySchema = z.object({
  completed_at: z.string().datetime({ offset: true }).default(() => new Date().toISOString()),
})

export type CreateActivityInput  = z.infer<typeof createActivitySchema>
export type UpdateActivityInput  = z.infer<typeof updateActivitySchema>
export type CompleteActivityInput = z.infer<typeof completeActivitySchema>
export type ActivityType         = z.infer<typeof activityTypeSchema>
export type ActivityStatus       = z.infer<typeof activityStatusSchema>
