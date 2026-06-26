import { z } from 'zod'

export const upsertOpportunityCostSchema = z.object({
  opportunity_id: z.string().uuid(),
  costo: z.number().min(0, 'El costo no puede ser negativo'),
  notas: z.string().max(500).nullable().optional(),
})

export type UpsertOpportunityCostInput = z.infer<typeof upsertOpportunityCostSchema>
