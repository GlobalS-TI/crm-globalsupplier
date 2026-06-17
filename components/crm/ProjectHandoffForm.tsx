'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { ActionState } from '@/app/(dashboard)/proyectos/actions'
import type { ProjectHandoffRow } from '@/lib/repositories/interfaces/IProjectRepository'
import type { ProjectStatus } from '@/lib/types'
import { PROJECT_STATUS_ORDER } from '@/lib/types'

interface ChecklistItem {
  key:         keyof Pick<ProjectHandoffRow,
    'component_states' | 'breakpoints_defined' | 'interactions_annotated' | 'assets_exported' | 'naming_convention'>
  noteKey:     keyof Pick<ProjectHandoffRow,
    'component_states_note' | 'breakpoints_note' | 'interactions_note' | 'assets_note' | 'naming_note'>
  label:       string
  description: string
}

const ITEMS: ChecklistItem[] = [
  {
    key: 'component_states', noteKey: 'component_states_note',
    label: 'Estados de componentes',
    description: 'Hover, error, vacío y cargando están definidos en el diseño.',
  },
  {
    key: 'breakpoints_defined', noteKey: 'breakpoints_note',
    label: 'Breakpoints definidos',
    description: 'Mobile, tablet y desktop especificados en el archivo de diseño.',
  },
  {
    key: 'interactions_annotated', noteKey: 'interactions_note',
    label: 'Interacciones anotadas',
    description: 'Transiciones, animaciones y comportamientos documentados.',
  },
  {
    key: 'assets_exported', noteKey: 'assets_note',
    label: 'Assets exportados',
    description: 'Íconos, imágenes y vectores listos en el formato acordado.',
  },
  {
    key: 'naming_convention', noteKey: 'naming_note',
    label: 'Naming convention',
    description: 'Capas y componentes nombrados según la convención del equipo.',
  },
]

interface Props {
  action:  (prev: ActionState, form: FormData) => Promise<ActionState>
  handoff: ProjectHandoffRow | null
  status:  ProjectStatus
}

export function ProjectHandoffForm({ action, handoff, status }: Props) {
  const [state, dispatch, pending] = useActionState(action, null)

  const isRelevant = PROJECT_STATUS_ORDER[status] >= PROJECT_STATUS_ORDER['DESIGN']

  if (!isRelevant) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        El handoff checklist aplica a partir del estado <strong>Design</strong>.
        <br />El proyecto está actualmente en <strong>{status}</strong>.
      </div>
    )
  }

  const completedCount = ITEMS.filter(i => handoff?.[i.key]).length

  return (
    <form action={dispatch} className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {completedCount} de {ITEMS.length} ítems completados
        </p>
        {completedCount === ITEMS.length && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ✓ Handoff completo — listo para Development
          </span>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{state.error}</p>
      )}

      <div className="space-y-4">
        {ITEMS.map(item => (
          <div
            key={item.key}
            className={cn(
              'rounded-lg border p-4 space-y-3 transition-colors',
              handoff?.[item.key] ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20' : 'bg-card',
            )}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name={item.key}
                defaultChecked={handoff?.[item.key] ?? false}
                className="mt-0.5 h-4 w-4 rounded accent-primary"
              />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </label>
            <Input
              name={item.noteKey}
              defaultValue={handoff?.[item.noteKey] ?? ''}
              placeholder="Nota opcional…"
              className="text-xs h-8"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : 'Guardar Handoff'}
        </Button>
      </div>
    </form>
  )
}
