'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { createSection, updateSection } from '@/app/(dashboard)/leads/actions'
import type { LeadSectionRow } from '@/lib/repositories/interfaces/ILeadRepository'

type ActionState = { error: string } | null

// ── Create ────────────────────────────────────────────────────────

export function CreateSectionButton() {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createSection, null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state === null) setOpen(false)
    wasPending.current = pending
  }, [pending, state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
          <Plus className="h-3.5 w-3.5" />
          Nueva campaña
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva sección de leads</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-2">
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="cs_nombre">Nombre *</Label>
            <Input id="cs_nombre" name="nombre" required autoFocus placeholder="Ej: Campaña LinkedIn Q3" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cs_desc">Descripción</Label>
            <Textarea id="cs_desc" name="descripcion" rows={2} placeholder="Opcional" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? 'Creando…' : 'Crear sección'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit ──────────────────────────────────────────────────────────

export function EditSectionButton({ section }: { section: LeadSectionRow }) {
  const [open, setOpen] = useState(false)
  const bound = updateSection.bind(null, section.id)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(bound, null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state === null) setOpen(false)
    wasPending.current = pending
  }, [pending, state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity">
          <Pencil className="h-3 w-3 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar sección</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-2">
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="es_nombre">Nombre *</Label>
            <Input id="es_nombre" name="nombre" required defaultValue={section.nombre} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="es_desc">Descripción</Label>
            <Textarea id="es_desc" name="descripcion" rows={2} defaultValue={section.descripcion ?? ''} />
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
