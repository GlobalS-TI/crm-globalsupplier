import { z } from 'zod'

export const orderStatusSchema = z.enum(['revision_cliente', 'aprobado', 'cancelado'])

export const createOrderSchema = z.object({
  opportunity_id: z.string().uuid(),
  quote_id:       z.string().uuid(),
  status:         orderStatusSchema.default('revision_cliente'),
  document_url:   z.string().url().optional(),
  external_ref:   z.string().max(255).optional(),
  notas:          z.string().max(2000).optional(),
})

export const updateOrderSchema = z.object({
  status:         orderStatusSchema.optional(),
  document_url:   z.string().url().optional(),
  external_ref:   z.string().max(255).optional(),
  notas:          z.string().max(2000).optional(),
})

export const orderProviderSchema = z.object({
  order_id:  z.string().uuid(),
  proveedor: z.string().min(1).max(255),
  monto:     z.number().min(0).optional(),
  notas:     z.string().max(1000).optional(),
})

export type OrderStatus         = z.infer<typeof orderStatusSchema>
export type CreateOrderInput    = z.infer<typeof createOrderSchema>
export type UpdateOrderInput    = z.infer<typeof updateOrderSchema>
export type OrderProviderInput  = z.infer<typeof orderProviderSchema>
