'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import type { ActionState } from '@/app/(dashboard)/proyectos/actions'
import type { ProjectBriefRow } from '@/lib/repositories/interfaces/IProjectRepository'

interface Props {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
  brief:  ProjectBriefRow | null
}

export function ProjectBriefForm({ action, brief }: Props) {
  const [state, dispatch, pending] = useActionState(action, null)

  return (
    <form action={dispatch} className="space-y-5">
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="what">¿Qué se solicita? *</Label>
        <Textarea
          id="what" name="what" rows={4}
          defaultValue={brief?.what ?? ''}
          placeholder="Describe qué se necesita construir o diseñar…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="why">¿Por qué? / Impacto esperado *</Label>
        <Textarea
          id="why" name="why" rows={4}
          defaultValue={brief?.why ?? ''}
          placeholder="KPI que mueve, objetivo de negocio, contexto estratégico…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="deadline_desired">Fecha deseada</Label>
          <Input id="deadline_desired" name="deadline_desired" type="date" defaultValue={brief?.deadline_desired ?? ''} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline_real">Fecha real comprometida</Label>
          <Input id="deadline_real" name="deadline_real" type="date" defaultValue={brief?.deadline_real ?? ''} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notas adicionales</Label>
        <Textarea
          id="notes" name="notes" rows={3}
          defaultValue={brief?.notes ?? ''}
          placeholder="Referencias, restricciones, contexto extra…"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar Brief'}
        </Button>
      </div>
    </form>
  )
}
