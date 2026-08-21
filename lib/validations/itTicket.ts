import { z } from 'zod'
import { businessUnitSchema } from './opportunity'

export const itTicketPrioritySchema = z.enum(['bajo', 'medio', 'alto', 'urgente'])
export const itTicketStatusSchema   = z.enum(['abierto', 'en_proceso', 'qa_ready', 'prod_ready', 'resuelto'])

export const createITTicketSchema = z.object({
  title:       z.string().min(1, 'El título es requerido').max(200),
  description: z.string().max(5000).optional(),
  brand:       businessUnitSchema,
  priority:    itTicketPrioritySchema.default('medio'),
})

export const setITTicketPrioritySchema = z.object({
  priority: itTicketPrioritySchema,
})

export const advanceITTicketStatusSchema = z.object({
  comment: z.string().max(1000).optional(),
})

export const setITTicketStatusSchema = z.object({
  status:  itTicketStatusSchema,
  comment: z.string().max(1000).optional(),
})

export const itTicketFileSchema = z.object({
  ticket_id: z.string().uuid(),
  nombre:    z.string().min(1).max(255),
  file_path: z.string().min(1),
  mime_type: z.string().max(100).optional(),
  file_size: z.number().int().positive().optional(),
})

export const itTicketMessageSchema = z.object({
  content:    z.string().min(1, 'El mensaje no puede estar vacío').max(5000),
  file_url:   z.string().url().optional(),
  file_label: z.string().max(200).optional(),
})

export type ITTicketPriorityInput   = z.infer<typeof itTicketPrioritySchema>
export type ITTicketStatusInput     = z.infer<typeof itTicketStatusSchema>
export type CreateITTicketInput     = z.infer<typeof createITTicketSchema>
export type SetITTicketPriorityInput   = z.infer<typeof setITTicketPrioritySchema>
export type AdvanceITTicketStatusInput = z.infer<typeof advanceITTicketStatusSchema>
export type SetITTicketStatusInput  = z.infer<typeof setITTicketStatusSchema>
export type ITTicketFileInput       = z.infer<typeof itTicketFileSchema>
export type ITTicketMessageInput    = z.infer<typeof itTicketMessageSchema>
