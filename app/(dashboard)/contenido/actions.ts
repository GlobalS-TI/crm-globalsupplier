'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ContentCategoryRepository,
  ContentItemRepository,
  ContentFileRepository,
} from '@/lib/repositories/supabase/ContentRepository'
import { ContentService } from '@/lib/services/ContentService'

type ActionState = { error: string } | null

function service() {
  return new ContentService(
    new ContentCategoryRepository(),
    new ContentItemRepository(),
    new ContentFileRepository(),
  )
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  return user
}

// ── Categories ────────────────────────────────────────────────────

export async function createCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const ordenRaw = form.get('orden')
    const data = {
      nombre: form.get('nombre') as string,
      icono:  (form.get('icono') as string) || undefined,
      orden:  ordenRaw !== null ? Number(ordenRaw) : 9999,
    }
    await service().createCategory(data)
    revalidatePath('/contenido')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateCategory(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const ordenRaw = form.get('orden')
    const data: { nombre: string; icono?: string; orden?: number } = {
      nombre: form.get('nombre') as string,
      icono:  (form.get('icono') as string) || undefined,
    }
    if (ordenRaw !== null) data.orden = Number(ordenRaw)
    await service().updateCategory(id, data)
    revalidatePath('/contenido')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function reorderCategories(orderedIds: string[]): Promise<void> {
  const svc = service()
  await Promise.all(
    orderedIds.map((id, index) => svc.updateCategory(id, { orden: index }))
  )
  revalidatePath('/contenido')
}

export async function deleteCategory(id: string): Promise<void> {
  await service().deleteCategory(id)
  revalidatePath('/contenido')
  redirect('/contenido')
}

// ── Items ─────────────────────────────────────────────────────────

export async function createItem(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await getUser()
    const categoryId = form.get('category_id') as string
    await service().createItem({
      category_id:   categoryId,
      business_unit: form.get('business_unit'),
      nombre:        form.get('nombre') as string,
      descripcion:   (form.get('descripcion') as string) || undefined,
    }, user.id)
    revalidatePath('/contenido')
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e
    return { error: (e as Error).message }
  }
  redirect(`/contenido?cat=${form.get('category_id')}`)
}

// Modal variant — returns the created item instead of redirecting
export async function createItemAndReturn(
  form: FormData
): Promise<{ id: string; businessUnit: string } | { error: string }> {
  try {
    const user = await getUser()
    const item = await service().createItem({
      category_id:   form.get('category_id') as string,
      business_unit: form.get('business_unit'),
      nombre:        form.get('nombre') as string,
      descripcion:   (form.get('descripcion') as string) || undefined,
    }, user.id)
    revalidatePath('/contenido')
    return { id: item.id, businessUnit: item.business_unit }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateItem(id: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    await service().updateItem(id, {
      nombre:      form.get('nombre') as string,
      descripcion: (form.get('descripcion') as string) || undefined,
    })
    revalidatePath(`/contenido/${id}`)
    revalidatePath('/contenido')
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteItem(id: string, categoryId: string): Promise<void> {
  await service().deleteItem(id)
  revalidatePath('/contenido')
  redirect(`/contenido?cat=${categoryId}`)
}

// Inline delete from list — no redirect, just revalidates
export async function deleteItemSilent(id: string): Promise<void> {
  await service().deleteItem(id)
  revalidatePath('/contenido')
}

// ── Files ─────────────────────────────────────────────────────────

export async function addYouTubeFile(_prev: ActionState, form: FormData): Promise<ActionState> {
  try {
    const user = await getUser()
    const itemId = form.get('item_id') as string
    await service().addFile({
      item_id: itemId,
      tipo:    'youtube_url',
      nombre:  form.get('nombre') as string,
      url:     form.get('url') as string,
    }, user.id)
    revalidatePath(`/contenido/${itemId}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function addUploadedFile(data: {
  item_id:   string
  nombre:    string
  file_path: string
  mime_type: string | undefined
  file_size: number | undefined
}): Promise<ActionState> {
  try {
    const user = await getUser()
    await service().addFile({ ...data, tipo: 'upload' }, user.id)
    revalidatePath(`/contenido/${data.item_id}`)
    return null
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function removeFile(id: string, itemId: string): Promise<void> {
  await service().deleteFile(id)
  revalidatePath(`/contenido/${itemId}`)
}
