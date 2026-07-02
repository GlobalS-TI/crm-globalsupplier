import { z } from 'zod'

const USER_ROLES = [
  'director_general',
  'direccion_comercial',
  'vendedor',
  'marketing',
  'administracion',
] as const

const BUSINESS_UNITS = [
  'global_supplier_mty',
  'thunder_safety',
  'thunder_led',
  'got_fresh_breath',
  'gtx_systems',
  'juno_promotional',
  'fire_spot',
] as const

export const UpdateProfileSchema = z.object({
  full_name:           z.string().min(2, 'Mínimo 2 caracteres').max(100),
  role:                z.enum(USER_ROLES),
  is_active:           z.boolean(),
  email:               z.string().email('Email inválido').optional(),
  business_units:      z.array(z.enum(BUSINESS_UNITS)).optional(),
  new_password:        z.string().min(8, 'Mínimo 8 caracteres').optional().or(z.literal('')),
  send_password_email: z.boolean().optional(),
})

export const CreateUserSchema = z.object({
  email:     z.string().email('Email inválido'),
  full_name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  password:  z.string().min(8, 'Mínimo 8 caracteres'),
  role:      z.enum(USER_ROLES),
})

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type CreateUserInput    = z.infer<typeof CreateUserSchema>
