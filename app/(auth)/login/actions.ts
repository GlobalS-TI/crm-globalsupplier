'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ActionState = { error: string } | null

export async function login(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email    = form.get('email')    as string
  const password = form.get('password') as string

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'Correo o contraseña incorrectos.' }
  }

  redirect('/dashboard')
}
