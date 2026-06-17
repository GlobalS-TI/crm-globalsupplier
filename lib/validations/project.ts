import { z } from 'zod'
import { businessUnitSchema } from './opportunity'

export const projectStatusSchema = z.enum([
  'INCOMING', 'ANALYSIS', 'DESIGN', 'DEVELOPMENT', 'QA', 'DELIVERED',
])

export const projectFileTypeSchema = z.enum(['FIGMA', 'REPO', 'ASSET', 'DOC', 'OTHER'])

export const createProjectSchema = z.object({
  title:           z.string().min(1, 'El título es requerido').max(200),
  description:     z.string().max(2000).optional(),
  brand:           businessUnitSchema,
  stakeholder_id:  z.string().uuid().optional(),
  requested_by_id: z.string().uuid().optional(),
  due_date:        z.string().date().optional(),
  estimated_hours: z.coerce.number().min(0).max(9999).optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export const briefSchema = z.object({
  what:             z.string().max(5000).optional(),
  why:              z.string().max(5000).optional(),
  deadline_real:    z.string().date().optional(),
  deadline_desired: z.string().date().optional(),
  notes:            z.string().max(5000).optional(),
})

export const handoffSchema = z.object({
  component_states:       z.boolean().default(false),
  component_states_note:  z.string().max(500).optional(),
  breakpoints_defined:    z.boolean().default(false),
  breakpoints_note:       z.string().max(500).optional(),
  interactions_annotated: z.boolean().default(false),
  interactions_note:      z.string().max(500).optional(),
  assets_exported:        z.boolean().default(false),
  assets_note:            z.string().max(500).optional(),
  naming_convention:      z.boolean().default(false),
  naming_note:            z.string().max(500).optional(),
})

export const decisionLogEntrySchema = z.object({
  entry: z.string().min(1, 'La entrada no puede estar vacía').max(5000),
})

export const projectFileSchema = z.object({
  label: z.string().min(1, 'El label es requerido').max(200),
  url:   z.string().url('URL inválida'),
  type:  projectFileTypeSchema,
})

export const advanceStatusSchema = z.object({
  comment: z.string().max(1000).optional(),
})

export type CreateProjectInput    = z.infer<typeof createProjectSchema>
export type UpdateProjectInput    = z.infer<typeof updateProjectSchema>
export type BriefInput            = z.infer<typeof briefSchema>
export type HandoffInput          = z.infer<typeof handoffSchema>
export type DecisionLogEntryInput = z.infer<typeof decisionLogEntrySchema>
export type ProjectFileInput      = z.infer<typeof projectFileSchema>
