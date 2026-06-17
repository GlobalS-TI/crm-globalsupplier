'use client'

import { useActionState, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PROJECT_STATUSES, PROJECT_STATUS_ORDER, PROJECT_STATUS_LABELS } from '@/lib/types'
import type { ProjectStatus } from '@/lib/types'
import type { ActionState } from '@/app/(dashboard)/proyectos/actions'

interface Props {
  projectId: string
  status:    ProjectStatus
  action:    (prev: ActionState, form: FormData) => Promise<ActionState>
}

export function ProjectStageTransition({ projectId: _, status, action }: Props) {
  const [open, setOpen] = useState(false)
  const [state, dispatch, pending] = useActionState(
    async (prev: ActionState, form: FormData) => {
      const result = await action(prev, form)
      if (!result) setOpen(false)   // cierra solo si no hay error
      return result
    },
    null,
  )

  const currentIdx = PROJECT_STATUS_ORDER[status]
  const nextStatus = PROJECT_STATUSES[currentIdx + 1] as ProjectStatus | undefined

  if (!nextStatus) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Proyecto entregado
      </span>
    )
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Avanzar de fase
        <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avanzar a {PROJECT_STATUS_LABELS[nextStatus]}</DialogTitle>
            <DialogDescription>
              El proyecto pasará de <strong>{PROJECT_STATUS_LABELS[status]}</strong> a{' '}
              <strong>{PROJECT_STATUS_LABELS[nextStatus]}</strong>. Esta acción se registra en el historial.
            </DialogDescription>
          </DialogHeader>

          <form action={dispatch} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="comment">Comentario <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                id="comment"
                name="comment"
                rows={3}
                placeholder="Observaciones sobre este avance de fase…"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {state.error}
              </p>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Avanzando…' : `Confirmar → ${PROJECT_STATUS_LABELS[nextStatus]}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
