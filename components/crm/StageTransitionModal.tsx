'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ActionState } from '@/app/(dashboard)/oportunidades/actions'
import type { OpportunityStage } from '@/lib/validations/opportunity'

const STAGE_LABELS: Record<OpportunityStage, string> = {
  nuevo_lead: 'Nuevo lead', contactado: 'Contactado', diagnostico: 'Diagnóstico',
  cotizacion_enviada: 'Cotización enviada', seguimiento: 'Seguimiento',
  negociacion: 'Negociación', ganado: 'Ganado', perdido: 'Perdido',
}

interface StageTransitionModalProps {
  targetStage: OpportunityStage
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
}

export function StageTransitionModal({ targetStage, action }: StageTransitionModalProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(action, null)
  const submitted = useRef(false)
  const needsMonto = targetStage === 'ganado'

  useEffect(() => {
    if (submitted.current && state === null && !pending) {
      setOpen(false)
      submitted.current = false
    }
  }, [state, pending])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">{STAGE_LABELS[targetStage]}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Mover a {STAGE_LABELS[targetStage]}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {targetStage === 'ganado'
              ? 'Esta acción marcará la oportunidad como ganada. Ingresa el monto final.'
              : 'Esta acción marcará la oportunidad como perdida. Esta operación no bloquea edición futura.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={formAction} id="stage-form" className="space-y-3" onSubmit={() => { submitted.current = true }}>
          <input type="hidden" name="etapa" value={targetStage} />
          {needsMonto && (
            <div className="space-y-1.5">
              <Label htmlFor="monto_final">Monto final (MXN) *</Label>
              <Input id="monto_final" name="monto_final" type="number" min={0.01} step="0.01" required />
            </div>
          )}
          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </form>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction type="submit" form="stage-form" disabled={pending}>
            {pending ? 'Guardando…' : 'Confirmar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
