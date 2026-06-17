'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Trash2, Figma, Github, FileText, Box, Link2 } from 'lucide-react'
import type { ActionState } from '@/app/(dashboard)/proyectos/actions'
import type { ProjectFileRow } from '@/lib/repositories/interfaces/IProjectRepository'
import type { ProjectFileType } from '@/lib/types'

const FILE_TYPE_LABELS: Record<ProjectFileType, string> = {
  FIGMA: 'Figma', REPO: 'Repositorio', ASSET: 'Asset', DOC: 'Documento', OTHER: 'Otro',
}

const FILE_TYPE_ICON: Record<ProjectFileType, React.ComponentType<{ className?: string }>> = {
  FIGMA: Figma, REPO: Github, ASSET: Box, DOC: FileText, OTHER: Link2,
}

interface Props {
  addAction:    (prev: ActionState, form: FormData) => Promise<ActionState>
  deleteAction: (fileId: string) => Promise<void>
  files:        ProjectFileRow[]
}

export function ProjectFilesPanel({ addAction, deleteAction, files }: Props) {
  const [state, dispatch, pending] = useActionState(addAction, null)

  return (
    <div className="space-y-6">
      {/* Lista */}
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Sin archivos vinculados.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {files.map(file => {
            const Icon = FILE_TYPE_ICON[file.type as ProjectFileType] ?? Link2
            return (
              <div key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.label}</p>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    {file.url}
                  </a>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {FILE_TYPE_LABELS[file.type as ProjectFileType]}
                </Badge>
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-4 w-4" />
                </a>
                <form action={() => deleteAction(file.id)}>
                  <button type="submit" className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      )}

      {/* Formulario de nuevo archivo */}
      <form action={dispatch} className="space-y-4 pt-4 border-t">
        <p className="text-sm font-medium">Vincular archivo</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="label">Label *</Label>
            <Input id="label" name="label" required placeholder="ej. Diseño v2" />
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="url">URL *</Label>
            <Input id="url" name="url" type="url" required placeholder="https://…" />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" defaultValue="OTHER">
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FILE_TYPE_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Agregando…' : 'Agregar'}
          </Button>
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </form>
    </div>
  )
}
