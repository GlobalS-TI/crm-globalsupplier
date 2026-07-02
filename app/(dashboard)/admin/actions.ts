'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UpdateProfileSchema, CreateUserSchema } from '@/lib/validations/profile'
import type { UpdateProfileInput } from '@/lib/validations/profile'

export async function updateUser(id: string, data: Partial<UpdateProfileInput>): Promise<{ error?: string }> {
  const parsed = UpdateProfileSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(parsed.data).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/usuarios')
  return {}
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ is_active: isActive }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/usuarios')
  return {}
}

export async function createUser(raw: unknown): Promise<{ error?: string }> {
  const parsed = CreateUserSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.data ? '' : parsed.error.errors[0]?.message ?? 'Datos inválidos' }

  const { email, full_name, password, role } = parsed.data

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError || !authData.user) return { error: authError?.message ?? 'Error al crear usuario' }

  // El trigger on_auth_user_created crea el profile con role='vendedor'.
  // Actualizamos full_name y role via supabaseAdmin (auth.uid() IS NULL → trigger lo permite).
  await supabaseAdmin
    .from('profiles')
    .update({ full_name, role })
    .eq('id', authData.user.id)

  revalidatePath('/admin/usuarios')
  return {}
}
