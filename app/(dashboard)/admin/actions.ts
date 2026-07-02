'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UpdateProfileSchema, CreateUserSchema } from '@/lib/validations/profile'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'CRM Global Supplier <noreply@globalsupplier.dev>'

export async function updateUser(id: string, raw: unknown): Promise<{ error?: string }> {
  const parsed = UpdateProfileSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message }

  const { full_name, role, is_active, email, business_units, new_password, send_password_email } = parsed.data
  const errors: string[] = []

  // 1. Campos de profile (nombre, rol, estado) — via sesión del usuario (RLS permite administracion)
  const supabase = await createClient()
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name, role, is_active })
    .eq('id', id)
  if (profileError) errors.push(profileError.message)

  // 2. Email — actualizar en auth.users + profiles vía supabaseAdmin
  if (email) {
    const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(id, { email })
    if (emailError) {
      errors.push(`Email: ${emailError.message}`)
    } else {
      await supabaseAdmin.from('profiles').update({ email }).eq('id', id)
    }
  }

  // 3. Business units — reemplazar todo el set
  if (business_units !== undefined) {
    await supabaseAdmin.from('profile_business_units').delete().eq('profile_id', id)
    if (business_units.length > 0) {
      await supabaseAdmin
        .from('profile_business_units')
        .insert(business_units.map(bu => ({ profile_id: id, business_unit: bu })))
    }
  }

  // 4. Contraseña — actualizar en auth.users vía supabaseAdmin
  if (new_password) {
    const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(id, { password: new_password })
    if (pwError) {
      errors.push(`Contraseña: ${pwError.message}`)
    } else if (send_password_email) {
      // Obtener email del usuario para enviar la notificación
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(id)
      const targetEmail = authUser?.user?.email
      if (targetEmail) {
        void resend.emails.send({
          from: FROM,
          to: targetEmail,
          subject: 'Tu contraseña en CRM Global Supplier fue actualizada',
          html: `
            <p>Hola ${full_name},</p>
            <p>Tu contraseña en el CRM de Global Supplier fue actualizada por el administrador.</p>
            <p><strong>Nueva contraseña:</strong> ${new_password}</p>
            <p>Puedes iniciar sesión en <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://crm.globalsupplier.com.mx'}/login">crm.globalsupplier.com.mx</a></p>
            <p>Te recomendamos cambiarla en tu próximo inicio de sesión.</p>
          `,
        })
      }
    }
  }

  if (errors.length > 0) return { error: errors.join(' | ') }

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
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Datos inválidos' }

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
