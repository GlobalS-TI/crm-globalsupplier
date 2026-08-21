'use client'

import { useActionState, useEffect, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { IT_TICKET_STATUSES, IT_TICKET_STATUS_LABELS } from '@/lib/types'
import type { ITTicketStatus } from '@/lib/types'
import type { ActionState } from '@/app/(dashboard)/soporte-ti/actions'

interface Props {
  status: ITTicketStatus
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
}

const FINAL_STATUS: ITTicketStatus = 'resuelto'

export function ITTicketStageTransition({ status, action }: Props) {
  const [localStatus, setLocalStatus] = useState<ITTicketStatus>(status)
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => setLocalStatus(status), [status])

  const [state, dispatch, pending] = useActionState(
    async (prev: ActionState, form: FormData) => {
      const result = await action(prev, form)
      if (!result) setConfirmOpen(false)
      else setLocalStatus(status)
      return result
    },
    null,
  )

  function handleChange(value: string) {
    const target = value as ITTicketStatus
    if (target === status) return

    if (target === FINAL_STATUS) {
      setConfirmOpen(true)
      return
    }

    setLocalStatus(target)
    const form = new FormData()
    form.set('status', target)
    dispatch(form)
  }

  if (status === FINAL_STATUS) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ticket resuelto
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

        {!confirmOpen && state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Marcar como {IT_TICKET_STATUS_LABELS[FINAL_STATUS]}</DialogTitle>
            <DialogDescription>
              El ticket pasará de <strong>{IT_TICKET_STATUS_LABELS[status]}</strong> a{' '}
              <strong>{IT_TICKET_STATUS_LABELS[FINAL_STATUS]}</strong>. Esta acción se registra en el historial.
            </DialogDescription>
          </DialogHeader>

          <form action={dispatch} className="space-y-4">
            <input type="hidden" name="status" value={FINAL_STATUS} />

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
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Guardando…' : 'Confirmar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
