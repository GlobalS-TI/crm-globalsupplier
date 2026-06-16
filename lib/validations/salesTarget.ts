import { z } from 'zod'

export const upsertSalesTargetSchema = z.object({
  vendedor_id:   z.string().uuid(),
  year:          z.number().int().min(2020).max(2100),
  month:         z.number().int().min(1).max(12),
  target_amount: z.number().min(0),
})

export type UpsertSalesTargetInput = z.infer<typeof upsertSalesTargetSchema>
