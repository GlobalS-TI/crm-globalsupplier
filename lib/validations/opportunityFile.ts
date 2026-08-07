import { z } from 'zod'

export const opportunityFileCategoriaSchema = z.enum(['cotizacion', 'orden_compra', 'factura', 'otro'])

export const createOpportunityFileSchema = z.object({
  opportunity_id: z.string().uuid(),
  categoria:      opportunityFileCategoriaSchema.default('otro'),
  nombre:         z.string().min(1).max(255),
  file_path:      z.string().min(1),
  mime_type:      z.string().max(100).optional(),
  file_size:      z.number().int().positive().optional(),
})

export type OpportunityFileCategoria   = z.infer<typeof opportunityFileCategoriaSchema>
export type CreateOpportunityFileInput = z.infer<typeof createOpportunityFileSchema>
