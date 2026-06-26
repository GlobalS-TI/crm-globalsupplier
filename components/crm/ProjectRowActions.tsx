'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Archive, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  projectId:     string
  projectTitle:  string
  deleteAction:  (id: string) => Promise<{ error: string } | null>
  archiveAction: (id: string) => Promise<{ error: string } | null>
}

export function ProjectRowActions({ projectId, projectTitle, deleteAction, archiveAction }: Props) {
  const router                     = useRouter()
  const [dialog, setDialog]        = useState<'delete' | 'archive' | null>(null)
  const [error, setError]          = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleAction(type: 'delete' | 'archive') {
    setError(null)
    startTransition(async () => {
      const action = type === 'delete' ? deleteAction : archiveAction
      const result = await action(projectId)
      if (result?.error) {
        setError(result.error)
      } else {
        setDialog(null)
        router.refresh()
        if (type === 'delete') router.push('/proyectos')
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => { setError(null); setDialog('archive') }}>
            <Archive className="h-4 w-4 mr-2 text-muted-foreground" />
            Archivar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => { setError(null); setDialog('delete') }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive dialog */}
      <Dialog open={dialog === 'archive'} onOpenChange={open => !open && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Archivar proyecto</DialogTitle>
            <DialogDescription>
              <strong>{projectTitle}</strong> se ocultará del listado principal.
              Podrás verlo activando el filtro de archivados.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>Cancelar</Button>
            <Button onClick={() => handleAction('archive')} disabled={pending}>
              {pending ? 'Archivando…' : 'Archivar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={dialog === 'delete'} onOpenChange={open => !open && setDialog(null)}>
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
            <Button variant="outline" onClick={() => setDialog(null)} disabled={pending}>Cancelar</Button>
            <Button variant="destructive" onClick={() => handleAction('delete')} disabled={pending}>
              {pending ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
