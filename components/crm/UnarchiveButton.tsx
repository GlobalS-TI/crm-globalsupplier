'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArchiveRestore, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  projectId:       string
  unarchiveAction: (id: string) => Promise<{ error: string } | null>
  deleteAction:    (id: string) => Promise<{ error: string } | null>
}

export function UnarchiveButton({ projectId, unarchiveAction, deleteAction }: Props) {
  const router                     = useRouter()
  const [dialog, setDialog]        = useState<'delete' | null>(null)
  const [error, setError]          = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleUnarchive() {
    setError(null)
    startTransition(async () => {
      const result = await unarchiveAction(projectId)
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteAction(projectId)
      if (result?.error) { setError(result.error); return }
      setDialog(null)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center gap-1 justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
          onClick={handleUnarchive}
          disabled={pending}
          title="Restaurar proyecto"
        >
          <ArchiveRestore className="h-3.5 w-3.5" />
          Restaurar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={() => setDialog('delete')}
          disabled={pending}
          title="Eliminar definitivamente"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-1 text-right">{error}</p>}

      <Dialog open={dialog === 'delete'} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar definitivamente</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se borrarán el brief, archivos,
              historial y todos los datos asociados al proyecto.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
