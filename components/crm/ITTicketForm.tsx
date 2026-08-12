'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BUSINESS_UNITS, BRAND_LABELS, IT_TICKET_PRIORITIES, IT_TICKET_PRIORITY_LABELS } from '@/lib/types'
import type { ActionState } from '@/app/(dashboard)/soporte-ti/actions'

interface Props {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
}

export function ITTicketForm({ action }: Props) {
  const [state, dispatch, pending] = useActionState(action, null)

  return (
    <form action={dispatch} className="space-y-5">
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" name="title" required placeholder="Describe brevemente el problema" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca *</Label>
          <Select name="brand" required>
            <SelectTrigger id="brand">
              <SelectValue placeholder="Seleccionar marca" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_UNITS.map(u => (
                <SelectItem key={u} value={u}>{BRAND_LABELS[u]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioridad</Label>
          <Select name="priority" defaultValue="medio">
            <SelectTrigger id="priority">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              {IT_TICKET_PRIORITIES.map(p => (
                <SelectItem key={p} value={p}>{IT_TICKET_PRIORITY_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description" name="description" rows={5}
            placeholder="Describe la problemática que estás encontrando…"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Creando…' : 'Crear ticket'}
        </Button>
      </div>
    </form>
  )
}
