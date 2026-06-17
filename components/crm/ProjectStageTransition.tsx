'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PROJECT_STATUSES, PROJECT_STATUS_ORDER, PROJECT_STATUS_LABELS } from '@/lib/types'
import type { ProjectStatus } from '@/lib/types'
import type { ActionState } from '@/app/(dashboard)/proyectos/actions'

interface Props {
  projectId: string
  status:    ProjectStatus
  action:    (prev: ActionState, form: FormData) => Promise<ActionState>
}

export function ProjectStageTransition({ projectId: _, status, action }: Props) {
  const [state, dispatch, pending] = useActionState(action, null)

  const currentIdx = PROJECT_STATUS_ORDER[status]
  const nextStatus = PROJECT_STATUSES[currentIdx + 1] as ProjectStatus | undefined

  if (!nextStatus) {
    return (
      <span className="text-xs text-muted-foreground italic">Proyecto entregado — estado final.</span>
    )
  }

  return (
    <form action={dispatch} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="comment" className="text-xs text-muted-foreground">
          Comentario para el avance (opcional)
        </Label>
        <Textarea id="comment" name="comment" rows={2} placeholder="Observaciones del cambio de estado…" />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
      )}

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? 'Avanzando…' : `Avanzar a ${PROJECT_STATUS_LABELS[nextStatus]}`}
      </Button>
    </form>
  )
}
