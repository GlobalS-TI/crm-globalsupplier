'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { ActionState } from '@/app/(dashboard)/proyectos/actions'
import type { ProjectDecisionLogRow } from '@/lib/repositories/interfaces/IProjectRepository'

const dateFmt = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
})

interface Props {
  action:  (prev: ActionState, form: FormData) => Promise<ActionState>
  entries: ProjectDecisionLogRow[]
}

export function ProjectDecisionLog({ action, entries }: Props) {
  const [state, dispatch, pending] = useActionState(action, null)

  return (
    <div className="space-y-6">
      {/* Lista de decisiones */}
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Sin decisiones registradas aún.</p>
      ) : (
        <ol className="relative border-l border-border space-y-6 pl-6">
          {entries.map((entry, i) => (
            <li key={entry.id} className="relative animate-fade-up" style={{ '--stagger': `${i * 40}ms` } as React.CSSProperties}>
              <span className="absolute -left-[1.35rem] flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 ring-2 ring-background">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              <div className="rounded-lg border bg-card p-4 space-y-1">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{entry.entry}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.author?.full_name ?? 'Sistema'} · {dateFmt.format(new Date(entry.created_at))}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}

      {/* Formulario de nueva entrada */}
      <form action={dispatch} className="space-y-3 pt-4 border-t">
        <Label htmlFor="entry">Nueva decisión</Label>
        <Textarea
          id="entry" name="entry" rows={3}
          placeholder="Registra una decisión técnica, de diseño o de alcance…"
          required
        />
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? 'Agregando…' : 'Agregar decisión'}
          </Button>
        </div>
      </form>
    </div>
  )
}
