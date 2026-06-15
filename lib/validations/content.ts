import { z } from 'zod'
import { businessUnitSchema } from '@/lib/validations/opportunity'

// ----------------------------------------------------------------
// Content Category
// ----------------------------------------------------------------
export const createContentCategorySchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(100),
  icono:  z.string().max(50).optional(),
  orden:  z.number().int().min(0).default(0),
})

export const updateContentCategorySchema = createContentCategorySchema.partial()

// ----------------------------------------------------------------
// Content Item
// ----------------------------------------------------------------
export const createContentItemSchema = z.object({
  category_id:   z.string().uuid(),
  business_unit: businessUnitSchema,
  nombre:        z.string().min(1, 'El nombre es requerido').max(255),
  descripcion:   z.string().max(2000).optional(),
})

export const updateContentItemSchema = createContentItemSchema
  .omit({ category_id: true, business_unit: true })
  .partial()

// ----------------------------------------------------------------
// Content File
// ----------------------------------------------------------------
export const createContentFileSchema = z.object({
  item_id:   z.string().uuid(),
  tipo:      z.enum(['upload', 'youtube_url']),
  nombre:    z.string().min(1).max(255),
  file_path: z.string().optional(),
  url:       z.string().url('URL inválida').optional(),
  mime_type: z.string().max(100).optional(),
  file_size: z.number().int().positive().optional(),
}).refine(
  (d) => d.tipo === 'youtube_url' ? !!d.url : !!d.file_path,
  { message: 'tipo upload requiere file_path; youtube_url requiere url' }
)

// ----------------------------------------------------------------
// Inferred types
// ----------------------------------------------------------------
export type CreateContentCategoryInput = z.infer<typeof createContentCategorySchema>
export type UpdateContentCategoryInput = z.infer<typeof updateContentCategorySchema>
export type CreateContentItemInput     = z.infer<typeof createContentItemSchema>
export type UpdateContentItemInput     = z.infer<typeof updateContentItemSchema>
export type CreateContentFileInput     = z.infer<typeof createContentFileSchema>
