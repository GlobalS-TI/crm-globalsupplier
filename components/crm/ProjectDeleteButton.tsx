'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  action:       (id: string) => Promise<{ error: string } | null>
  projectId:    string
  projectTitle: string
}

export function ProjectDeleteButton({ action, projectId, projectTitle }: Props) {
  const router                     = useRouter()
  const [open, setOpen]            = useState(false)
  const [error, setError]          = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await action(projectId)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push('/proyectos')
      }
    })
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar proyecto</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{projectTitle}</strong>? Esta acción no se puede deshacer —
              se borrarán el brief, archivos, historial y todos los datos asociados.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
              {pending ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
