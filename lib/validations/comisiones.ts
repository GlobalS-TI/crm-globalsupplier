import { z } from 'zod'
import { currencySchema } from '@/lib/validations/opportunity'

export const upsertOpportunityCostSchema = z.object({
  opportunity_id: z.string().uuid(),
  costo: z.number().min(0, 'El costo no puede ser negativo'),
  moneda: currencySchema.default('MXN'),
  tipo_cambio: z.number().positive().optional(),
  notas: z.string().max(500).nullable().optional(),
}).superRefine((d, ctx) => {
  if (d.moneda === 'USD' && d.tipo_cambio === undefined) {
    ctx.addIssue({
      code: 'custom',
      path: ['tipo_cambio'],
      message: 'tipo_cambio es requerido cuando la moneda es USD',
    })
  }
})

export type UpsertOpportunityCostInput = z.infer<typeof upsertOpportunityCostSchema>
