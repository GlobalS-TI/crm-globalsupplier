'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ContactRepository } from '@/lib/repositories/supabase/ContactRepository'
import { ContactService } from '@/lib/services/ContactService'

type ActionState = { error: string } | null

function parseForm(form: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {}
  for (const [key, value] of form.entries()) {
    if (typeof value === 'string' && value !== '' && value !== 'null') {
      obj[key] = value
    }
  }
  return obj
}

function service() {
  return new ContactService(new ContactRepository())
}

export async function createContact(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  try {
    const created = await service().create(parseForm(form), user.id)
    redirect(`/contactos/${created.id}`)
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e
    return { error: (e as Error).message }
  }
}

export async function updateContact(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await service().update(id, parseForm(form))
    revalidatePath(`/contactos/${id}`)
    revalidatePath('/contactos')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteContact(id: string): Promise<void> {
  await service().delete(id)
  revalidatePath('/contactos')
  redirect('/contactos')
}
