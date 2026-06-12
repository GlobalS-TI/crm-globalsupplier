import { z } from 'zod'

export const createContactSchema = z.object({
  nombre:     z.string().min(1, 'El nombre es requerido').max(255),
  apellido:   z.string().max(255).optional(),
  company_id: z.string().uuid().optional(),
  puesto:     z.string().max(150).optional(),
  email:      z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  telefono:   z.string().max(30).optional(),
  celular:    z.string().max(30).optional(),
  notas:      z.string().max(2000).optional(),
})

export const updateContactSchema = createContactSchema.partial()

export type CreateContactInput = z.infer<typeof createContactSchema>
export type UpdateContactInput = z.infer<typeof updateContactSchema>
