'use client'

import { useActionState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ActionState } from '@/app/(dashboard)/actividades/actions'

const TYPES = [
  { value: 'llamada',     label: 'Llamada' },
  { value: 'email',       label: 'Email' },
  { value: 'reunion',     label: 'Reunión' },
  { value: 'demo',        label: 'Demo' },
  { value: 'propuesta',   label: 'Propuesta' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'otro',        label: 'Otro' },
]

interface ActivityFormProps {
  opportunityId: string
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
  onSuccess?: () => void
}

export function ActivityForm({ opportunityId, action, onSuccess }: ActivityFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, form: FormData) => {
      const result = await action(prev, form)
      if (!result) { formRef.current?.reset(); onSuccess?.() }
      return result
    },
    null
  )

  const defaultFecha = new Date(Date.now() + 3600_000).toISOString().slice(0, 16)

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="opportunity_id" value={opportunityId} />

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Tipo *</Label>
          <Select name="tipo" defaultValue="llamada" required>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Fecha *</Label>
          <Input name="fecha" type="datetime-local" className="h-8 text-sm"
            defaultValue={defaultFecha} required />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Título *</Label>
        <Input name="titulo" className="h-8 text-sm" placeholder="Llamada de seguimiento…" required />
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Descripción</Label>
        <Textarea name="descripcion" className="text-sm" rows={2} placeholder="Notas…" />
      </div>

      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}

      <Button type="submit" size="sm" disabled={pending} className="w-full">
        {pending ? 'Guardando…' : 'Agregar actividad'}
      </Button>
    </form>
  )
}
