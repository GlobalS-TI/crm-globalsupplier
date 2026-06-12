import { z } from 'zod'

export const createCompanySchema = z.object({
  nombre:    z.string().min(1, 'El nombre es requerido').max(255),
  rfc:       z.string().max(13).optional(),
  industria: z.string().max(100).optional(),
  sitio_web: z.string().url('URL inválida').max(255).optional().or(z.literal('')),
  telefono:  z.string().max(30).optional(),
  ciudad:    z.string().max(100).optional(),
  estado:    z.string().max(100).optional(),
  notas:     z.string().max(2000).optional(),
})

export const updateCompanySchema = createCompanySchema.partial()

export type CreateCompanyInput = z.infer<typeof createCompanySchema>
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>
