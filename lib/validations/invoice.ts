import { z } from 'zod'

export const createInvoiceSchema = z.object({
  order_id:     z.string().uuid(),
  folio:        z.string().max(100).optional(),
  monto:        z.number().min(0).optional(),
  document_url: z.string().url().optional(),
})

export const updateInvoiceSchema = z.object({
  folio:        z.string().max(100).optional(),
  monto:        z.number().min(0).optional(),
  document_url: z.string().url().optional(),
})

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>
