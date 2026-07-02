import { z } from 'zod'

const USER_ROLES = [
  'director_general',
  'direccion_comercial',
  'vendedor',
  'marketing',
  'administracion',
] as const

export const UpdateProfileSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  role:      z.enum(USER_ROLES),
  is_active: z.boolean(),
})

export const CreateUserSchema = z.object({
  email:     z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  password:  z.string().min(8, 'Mínimo 8 caracteres'),
  role:      z.enum(USER_ROLES),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type CreateUserInput    = z.infer<typeof CreateUserSchema>
