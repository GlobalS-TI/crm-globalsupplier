'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BUSINESS_UNITS, BRAND_LABELS } from '@/lib/types'
import type { ActionState } from '@/app/(dashboard)/proyectos/actions'
import type { ProjectRow } from '@/lib/repositories/interfaces/IProjectRepository'

interface Profile { id: string; full_name: string }

interface Props {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
  project?: ProjectRow & { stakeholder?: { full_name: string } | null; requested_by?: { full_name: string } | null }
  profiles: Profile[]
}

export function ProjectForm({ action, project, profiles }: Props) {
  const [state, dispatch, pending] = useActionState(action, null)

  return (
    <form action={dispatch} className="space-y-5">
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" name="title" required defaultValue={project?.title} placeholder="Nombre del proyecto" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="brand">Marca *</Label>
          <Select name="brand" defaultValue={project?.brand} required>
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
          <Label htmlFor="due_date">Fecha límite</Label>
          <Input id="due_date" name="due_date" type="date" defaultValue={project?.due_date ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stakeholder_id">Stakeholder (aprueba)</Label>
          <Select name="stakeholder_id" defaultValue={project?.stakeholder_id ?? '__none__'}>
            <SelectTrigger id="stakeholder_id">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Sin asignar —</SelectItem>
              {profiles.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="requested_by_id">Solicitado por</Label>
          <Select name="requested_by_id" defaultValue={project?.requested_by_id ?? '__none__'}>
            <SelectTrigger id="requested_by_id">
              <SelectValue placeholder="Seleccionar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Sin asignar —</SelectItem>
              {profiles.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estimated_hours">Horas estimadas</Label>
          <Input
            id="estimated_hours" name="estimated_hours" type="number"
            min="0" max="9999" step="0.5"
            defaultValue={project?.estimated_hours ?? ''}
            placeholder="0"
          />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description" name="description" rows={3}
            defaultValue={project?.description ?? ''}
            placeholder="Contexto general del proyecto…"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : project ? 'Guardar cambios' : 'Crear proyecto'}
        </Button>
      </div>
    </form>
  )
}
