'use client'

import { useTransition, useState } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { kanbanReopenStage } from '@/app/(dashboard)/oportunidades/actions'
import type { OpportunityStage } from '@/lib/validations/opportunity'

const STAGE_LABELS: Partial<Record<OpportunityStage, string>> = {
  nuevo_lead: 'Nuevo lead', contactado: 'Contactado', diagnostico: 'Diagnóstico',
  cotizacion_enviada: 'Cotización enviada', seguimiento: 'Seguimiento',
  negociacion: 'Negociación',
}

interface Props {
  open:        boolean
  oppId:       string
  oppName:     string
  sourceStage: 'ganado' | 'perdido'
  targetStage: OpportunityStage
  onConfirm:   () => void
  onCancel:    () => void
}

export function KanbanReopenModal({ open, oppId, oppName, sourceStage, targetStage, onConfirm, onCancel }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      const result = await kanbanReopenStage(oppId, targetStage)
      if (result.error) {
        setError(result.error)
      } else {
        onConfirm()
      }
    })
  }

  function handleCancel() {
    setError(null)
    onCancel()
  }

  return (
    <AlertDialog open={open} onOpenChange={v => { if (!v) handleCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reabrir oportunidad</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-1">
              <p>
                <span className="font-medium text-foreground">{oppName}</span>
                {' '}está marcada como{' '}
                <span className="font-medium text-foreground">
                  {sourceStage === 'ganado' ? 'Ganada' : 'Perdida'}
                </span>
                . Se moverá a{' '}
                <span className="font-medium text-foreground">
                  {STAGE_LABELS[targetStage] ?? targetStage}
                </span>
                .
              </p>
              {sourceStage === 'ganado' && (
                <p className="text-amber-600 dark:text-amber-400 text-xs">
                  El monto final registrado será eliminado.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={pending}>
            {pending ? 'Guardando…' : 'Reabrir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
