'use client'

import { useState, useTransition } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { kanbanMoveToStage } from '@/app/(dashboard)/oportunidades/actions'
import type { OpportunityStage } from '@/lib/validations/opportunity'

interface Props {
  open:        boolean
  oppId:       string
  oppName:     string
  targetStage: 'ganado' | 'perdido'
  onConfirm:   () => void
  onCancel:    () => void
}

export function KanbanStageModal({ open, oppId, oppName, targetStage, onConfirm, onCancel }: Props) {
  const [monto, setMonto] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    if (targetStage === 'ganado') {
      const val = parseFloat(monto)
      if (!monto || isNaN(val) || val <= 0) {
        setError('El monto final debe ser mayor a 0')
        return
      }
    }
    setError(null)
    startTransition(async () => {
      const result = await kanbanMoveToStage(
        oppId,
        targetStage as OpportunityStage,
        targetStage === 'ganado' ? parseFloat(monto) : undefined,
      )
      if (result.error) {
        setError(result.error)
      } else {
        setMonto('')
        onConfirm()
      }
    })
  }

  function handleCancel() {
    setMonto('')
    setError(null)
    onCancel()
  }

  return (
    <AlertDialog open={open} onOpenChange={v => { if (!v) handleCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Mover a {targetStage === 'ganado' ? 'Ganado' : 'Perdido'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{oppName}</span>
            {targetStage === 'ganado'
              ? ' — Ingresa el monto final para marcar como ganada.'
              : ' — Esta acción marcará la oportunidad como perdida.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {targetStage === 'ganado' && (
          <div className="space-y-1.5 py-2">
            <Label htmlFor="kanban-monto">Monto final (MXN) *</Label>
            <Input
              id="kanban-monto"
              type="number"
              min={0.01}
              step="0.01"
              placeholder="0.00"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              autoFocus
            />
          </div>
        )}

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
