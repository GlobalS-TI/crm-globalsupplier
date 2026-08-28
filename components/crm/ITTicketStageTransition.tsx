'use client'

import { useActionState, useEffect, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { IT_TICKET_STATUSES, IT_TICKET_STATUS_LABELS, IT_TICKET_TERMINAL_STATUSES } from '@/lib/types'
import type { ITTicketStatus } from '@/lib/types'
import type { ActionState } from '@/app/(dashboard)/soporte-ti/actions'

interface Props {
  status: ITTicketStatus
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
}

const TERMINAL_DISPLAY: Record<string, { icon: typeof CheckCircle2; text: string; className: string }> = {
  resuelto: {
    icon:      CheckCircle2,
    text:      'Ticket resuelto',
    className: 'text-emerald-600 dark:text-emerald-400',
  },
  cancelado: {
    icon:      XCircle,
    text:      'Ticket cancelado',
    className: 'text-rose-600 dark:text-rose-400',
  },
}

function isTerminal(status: ITTicketStatus): boolean {
  return IT_TICKET_TERMINAL_STATUSES.includes(status)
}

export function ITTicketStageTransition({ status, action }: Props) {
  const [localStatus, setLocalStatus]   = useState<ITTicketStatus>(status)
  const [pendingTarget, setPendingTarget] = useState<ITTicketStatus | null>(null)

  useEffect(() => setLocalStatus(status), [status])

  const [state, dispatch, pending] = useActionState(
    async (prev: ActionState, form: FormData) => {
      const result = await action(prev, form)
      if (!result) setPendingTarget(null)
      else setLocalStatus(status)
      return result
    },
    null,
  )

  function handleChange(value: string) {
    const target = value as ITTicketStatus
    if (target === status) return

    if (isTerminal(target)) {
      setPendingTarget(target)
      return
    }

    setLocalStatus(target)
    const form = new FormData()
    form.set('status', target)
    dispatch(form)
  }

  if (isTerminal(status)) {
    const display = TERMINAL_DISPLAY[status]
    const Icon = display.icon
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${display.className}`}>
        <Icon className="h-3.5 w-3.5" />
        {display.text}
      </span>
    )
  }

  return (
    <>
      <div className="space-y-1.5">
        <Select value={localStatus} onValueChange={handleChange} disabled={pending}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IT_TICKET_STATUSES.map(s => (
              <SelectItem key={s} value={s}>
                {IT_TICKET_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!pendingTarget && state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>

      <Dialog open={!!pendingTarget} onOpenChange={v => { if (!v) setPendingTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          {pendingTarget && (
            <>
              <DialogHeader>
                <DialogTitle>Marcar como {IT_TICKET_STATUS_LABELS[pendingTarget]}</DialogTitle>
                <DialogDescription>
                  El ticket pasará de <strong>{IT_TICKET_STATUS_LABELS[status]}</strong> a{' '}
                  <strong>{IT_TICKET_STATUS_LABELS[pendingTarget]}</strong>. Esta acción se registra en el historial.
                </DialogDescription>
              </DialogHeader>

              <form action={dispatch} className="space-y-4">
                <input type="hidden" name="status" value={pendingTarget} />

                <div className="space-y-1.5">
                  <Label htmlFor="comment">Comentario <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <Textarea
                    id="comment"
                    name="comment"
                    rows={3}
                    placeholder="Observaciones sobre este cierre…"
                  />
                </div>

                {state?.error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {state.error}
                  </p>
                )}

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setPendingTarget(null)} disabled={pending}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? 'Guardando…' : 'Confirmar'}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
