import { z } from 'zod'

export const quoteStatusSchema = z.enum(['borrador', 'enviada', 'aceptada', 'rechazada'])

export const createQuoteSchema = z.object({
  opportunity_id: z.string().uuid(),
  status:         quoteStatusSchema.default('borrador'),
  document_url:   z.string().url().optional(),
  external_ref:   z.string().max(255).optional(),
  notas:          z.string().max(2000).optional(),
})

export const updateQuoteSchema = z.object({
  status:         quoteStatusSchema.optional(),
  document_url:   z.string().url().optional(),
  external_ref:   z.string().max(255).optional(),
  notas:          z.string().max(2000).optional(),
})

export type QuoteStatus        = z.infer<typeof quoteStatusSchema>
export type CreateQuoteInput   = z.infer<typeof createQuoteSchema>
export type UpdateQuoteInput   = z.infer<typeof updateQuoteSchema>
