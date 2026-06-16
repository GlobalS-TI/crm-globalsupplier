import { z } from 'zod'

export const taskColumnTypeSchema = z.enum([
  'text', 'number', 'date', 'selector', 'person', 'url', 'business_unit',
])

export const selectorOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  color: z.string().optional(),
})

export const columnConfigSchema = z.object({
  options: z.array(selectorOptionSchema).optional(),
})

export const createBoardColumnSchema = z.object({
  board_id:  z.string().uuid(),
  nombre:    z.string().min(1).max(100),
  tipo:      taskColumnTypeSchema,
  position:  z.number().int().min(0).default(0),
  config:    columnConfigSchema.default({}),
})

export const updateBoardColumnSchema = z.object({
  nombre:   z.string().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
  config:   columnConfigSchema.optional(),
})

export const createTaskSchema = z.object({
  board_id:       z.string().uuid(),
  titulo:         z.string().min(1).max(500),
  fecha_entrega:  z.string().date().optional(),
  opportunity_id: z.string().uuid().optional(),
})

export const updateTaskSchema = z.object({
  titulo:         z.string().min(1).max(500).optional(),
  fecha_entrega:  z.string().date().nullable().optional(),
  opportunity_id: z.string().uuid().nullable().optional(),
})

export const upsertColumnValueSchema = z.object({
  task_id:   z.string().uuid(),
  column_id: z.string().uuid(),
  value:     z.string().nullable(),
})

export type TaskColumnType        = z.infer<typeof taskColumnTypeSchema>
export type SelectorOption        = z.infer<typeof selectorOptionSchema>
export type ColumnConfig          = z.infer<typeof columnConfigSchema>
export type CreateBoardColumnInput = z.infer<typeof createBoardColumnSchema>
export type UpdateBoardColumnInput = z.infer<typeof updateBoardColumnSchema>
export type CreateTaskInput        = z.infer<typeof createTaskSchema>
export type UpdateTaskInput        = z.infer<typeof updateTaskSchema>
export type UpsertColumnValueInput = z.infer<typeof upsertColumnValueSchema>
