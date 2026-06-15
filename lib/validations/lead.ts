import { z } from 'zod'

// ── Sections ──────────────────────────────────────────────────────

export const createLeadSectionSchema = z.object({
  nombre:      z.string().min(1, 'El nombre es requerido').max(100),
  descripcion: z.string().max(500).optional(),
})

export const updateLeadSectionSchema = createLeadSectionSchema.partial()

export type CreateLeadSectionInput = z.infer<typeof createLeadSectionSchema>
export type UpdateLeadSectionInput = z.infer<typeof updateLeadSectionSchema>

// ── Leads ─────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  section_id:              z.string().uuid(),
  nombre:                  z.string().min(1, 'El nombre es requerido').max(200),
  empresa:                 z.string().max(200).optional(),
  email:                   z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono:                z.string().max(50).optional(),
  requerimientos:          z.string().max(3000).optional(),
  requirements_file_path:  z.string().optional(),
  assigned_to:             z.string().uuid().optional(),
})

export const updateLeadSchema = createLeadSchema
  .omit({ section_id: true })
  .extend({
    converted_opportunity_id: z.string().uuid().optional(),
    // Allow null to explicitly clear assignment (string | null | undefined)
    assigned_to: z.string().uuid().nullable().optional(),
  })
  .partial()

// Bulk import row (CSV / XLSX — no section_id, it's provided by context)
export const importLeadRowSchema = z.object({
  nombre:        z.string().min(1),
  empresa:       z.string().optional(),
  email:         z.string().email().optional().or(z.literal('')),
  telefono:      z.string().optional(),
  requerimientos: z.string().optional(),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>
export type ImportLeadRow  = z.infer<typeof importLeadRowSchema>
