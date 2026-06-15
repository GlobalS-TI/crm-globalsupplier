'use client'

import { useActionState, useEffect, useRef } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { IconPicker } from '@/components/crm/IconPicker'
import { createCategory, updateCategory } from '@/app/(dashboard)/contenido/actions'
import type { ContentCategoryRow } from '@/lib/repositories/interfaces/IContentRepository'

type ActionState = { error: string } | null

// ── Create ────────────────────────────────────────────────────────

export function CreateCategoryButton() {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createCategory, null)
  const formRef = useRef<HTMLFormElement>(null)

  // Close dialog on success by resetting the form
  useEffect(() => {
    if (!pending && state === null && formRef.current?.dataset.submitted === 'true') {
      formRef.current?.reset()
      formRef.current?.removeAttribute('data-submitted')
    }
  }, [pending, state])

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Nueva categoría
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva categoría</DialogTitle>
        </DialogHeader>
        <form
          ref={formRef}
          action={formAction}
          onSubmit={e => {
            if (formRef.current) formRef.current.dataset.submitted = 'true'
          }}
          className="space-y-4 pt-2"
        >
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cc_nombre">Nombre *</Label>
            <Input id="cc_nombre" name="nombre" required autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Ícono</Label>
            <IconPicker name="icono" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? 'Creando…' : 'Crear categoría'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit ──────────────────────────────────────────────────────────

export function EditCategoryButton({ category }: { category: ContentCategoryRow }) {
  const boundUpdate = updateCategory.bind(null, category.id)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(boundUpdate, null)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar categoría</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-2">
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ec_nombre">Nombre *</Label>
            <Input id="ec_nombre" name="nombre" required defaultValue={category.nombre} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Ícono</Label>
            <IconPicker name="icono" defaultValue={category.icono} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
