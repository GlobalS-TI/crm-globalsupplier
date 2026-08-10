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
    <form ref={formRef} action={formAction} className="space-y-5">
      <input type="hidden" name="opportunity_id" value={opportunityId} />

      <div className="space-y-2">
        <Label>Tipo *</Label>
        <Select name="tipo" defaultValue="llamada" required>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Fecha en su propia fila — el datetime-local necesita más ancho del que
          le toca compartiendo columna con Tipo, si no el valor se corta. */}
      <div className="space-y-2">
        <Label>Fecha *</Label>
        <Input name="fecha" type="datetime-local" defaultValue={defaultFecha} required />
      </div>

      <div className="space-y-2">
        <Label>Título *</Label>
        <Input name="titulo" placeholder="Llamada de seguimiento…" required />
      </div>

      <div className="space-y-2">
        <Label>Descripción</Label>
        <Textarea name="descripcion" rows={3} placeholder="Notas…" />
      </div>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Guardando…' : 'Agregar actividad'}
      </Button>
    </form>
  )
}
