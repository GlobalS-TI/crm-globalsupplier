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
  negociacion: 'Negociación', sin_respuesta: 'Sin respuesta', ganado: 'Ganado', perdido: 'Perdido',
}

const STAGE_DESCRIPTIONS: Partial<Record<OpportunityStage, string>> = {
  ganado:        'Esta acción marcará la oportunidad como ganada. Ingresa el monto final.',
  perdido:       'Esta acción marcará la oportunidad como perdida. Esta operación no bloquea edición futura.',
  sin_respuesta: 'El cliente dejó de responder. La oportunidad se moverá a "Sin respuesta" y podrás reabrirla más tarde desde el kanban.',
}

interface StageTransitionModalProps {
  targetStage: OpportunityStage
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
  moneda?: 'MXN' | 'USD'
}

export function StageTransitionModal({ targetStage, action, moneda = 'MXN' }: StageTransitionModalProps) {
  const [open, setOpen] = useState(false)
  const [state, formAction, pending] = useActionState(action, null)
  const submitted = useRef(false)
  const needsMonto = targetStage === 'ganado'
  const isUsd = moneda === 'USD'

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
            {STAGE_DESCRIPTIONS[targetStage]}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form action={formAction} id="stage-form" className="space-y-3" onSubmit={() => { submitted.current = true }}>
          <input type="hidden" name="etapa" value={targetStage} />
          {needsMonto && (
            <div className="space-y-1.5">
              <Label htmlFor="monto_final">Monto final ({moneda}) *</Label>
              <Input id="monto_final" name="monto_final" type="number" min={0.01} step="0.01" required />
            </div>
          )}
          {needsMonto && isUsd && (
            <div className="space-y-1.5">
              <Label htmlFor="tipo_cambio_final">Tipo de cambio al cierre (USD → MXN) *</Label>
              <Input id="tipo_cambio_final" name="tipo_cambio_final" type="number" min={0.0001} step="0.0001" required />
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
