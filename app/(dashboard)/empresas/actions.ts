'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { CompanyRepository } from '@/lib/repositories/supabase/CompanyRepository'
import { CompanyService } from '@/lib/services/CompanyService'

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
  return new CompanyService(new CompanyRepository())
}

export async function createCompany(_prev: ActionState, form: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  try {
    const created = await service().create(parseForm(form), user.id)
    // redirect outside try/catch not needed — redirect throws internally
    redirect(`/empresas/${created.id}`)
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e
    return { error: (e as Error).message }
  }
}

export async function updateCompany(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await service().update(id, parseForm(form))
    revalidatePath(`/empresas/${id}`)
    revalidatePath('/empresas')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteCompany(id: string): Promise<void> {
  await service().delete(id)
  revalidatePath('/empresas')
  redirect('/empresas')
}
