'use client'

import { useActionState, useTransition, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { Pencil, Trash2 } from 'lucide-react'
import { updateItem, deleteItemSilent } from '@/app/(dashboard)/contenido/actions'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ContentItemWithRelations } from '@/lib/repositories/interfaces/IContentRepository'

type ActionState = { error: string } | null

function EditModal({ item }: { item: ContentItemWithRelations }) {
  const [open, setOpen]  = useState(false)
  const updateAction     = updateItem.bind(null, item.id)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(updateAction, null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state === null) setOpen(false)
    wasPending.current = pending
  }, [pending, state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar elemento</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-1">
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ri_nombre">Nombre *</Label>
            <Input id="ri_nombre" name="nombre" required defaultValue={item.nombre} autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ri_desc">Descripción</Label>
            <Textarea id="ri_desc" name="descripcion" rows={2} defaultValue={item.descripcion ?? ''} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteButton({ item }: { item: ContentItemWithRelations }) {
  const [pending, start] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={pending}
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar elemento?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará &quot;{item.nombre}&quot; y todos sus archivos adjuntos.
            Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => start(async () => { await deleteItemSilent(item.id) })}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface Props {
  item:             ContentItemWithRelations
  isContentManager: boolean
}

export function ContentItemRow({ item, isContentManager }: Props) {
  const count = Number(item.content_files?.[0]?.count ?? 0)

  return (
    <tr className="group border-t first:border-t-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <Link href={`/contenido/${item.id}` as Route} className="font-medium hover:underline">
          {item.nombre}
        </Link>
        {item.descripcion && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.descripcion}</p>
        )}
      </td>
      <td className="px-4 py-3 text-right w-44">
        <div className="flex items-center justify-end gap-0.5">
          {isContentManager && (
            <>
              <EditModal item={item} />
              <DeleteButton item={item} />
            </>
          )}
          <span className="ml-2">
            {count > 0 ? (
              <span className="inline-flex items-center justify-center text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium tabular-nums">
                {count} {count === 1 ? 'archivo' : 'archivos'}
              </span>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </span>
        </div>
      </td>
    </tr>
  )
}
