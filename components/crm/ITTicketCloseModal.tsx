'use client'

import { useState, useTransition } from 'react'
import {
  AlertDialog, AlertDialogCancel, AlertDialogAction,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { kanbanMoveToStatus } from '@/app/(dashboard)/soporte-ti/actions'
import { IT_TICKET_STATUS_LABELS } from '@/lib/types'
import type { ITTicketStatus } from '@/lib/types'

interface Props {
  open:         boolean
  ticketId:     string
  ticketTitle:  string
  targetStatus: ITTicketStatus
  onConfirm:    () => void
  onCancel:     () => void
}

export function ITTicketCloseModal({ open, ticketId, ticketTitle, targetStatus, onConfirm, onCancel }: Props) {
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const targetLabel = IT_TICKET_STATUS_LABELS[targetStatus]

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await kanbanMoveToStatus(ticketId, targetStatus, comment.trim() || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        setComment('')
        onConfirm()
      }
    })
  }

  function handleCancel() {
    setComment('')
    setError(null)
    onCancel()
  }

  return (
    <AlertDialog open={open} onOpenChange={v => { if (!v) handleCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Marcar como {targetLabel}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{ticketTitle}</span> pasará a{' '}
            <strong>{targetLabel}</strong>. Esta acción se registra en el historial.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-1.5 py-2">
          <Label htmlFor="close-comment">Comentario <span className="text-muted-foreground font-normal">(opcional)</span></Label>
          <Textarea
            id="close-comment"
            rows={3}
            placeholder="Observaciones sobre este cierre…"
            value={comment}
            onChange={e => setComment(e.target.value)}
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {pending ? 'Guardando…' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
