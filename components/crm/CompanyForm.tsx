'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { CompanyRow } from '@/lib/repositories/interfaces/ICompanyRepository'

type ActionState = { error: string } | null

interface Props {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
  defaultValues?: Partial<CompanyRow>
  submitLabel?: string
}

export function CompanyForm({ action, defaultValues, submitLabel = 'Guardar' }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const { toast } = useToast()
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state === null) {
      toast({ title: 'Cambios guardados correctamente' })
    }
    wasPending.current = pending
  }, [pending, state, toast])

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" required defaultValue={defaultValues?.nombre ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rfc">RFC</Label>
          <Input id="rfc" name="rfc" maxLength={13} defaultValue={defaultValues?.rfc ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="industria">Industria</Label>
          <Input id="industria" name="industria" defaultValue={defaultValues?.industria ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" defaultValue={defaultValues?.telefono ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sitio_web">Sitio web</Label>
          <Input id="sitio_web" name="sitio_web" type="url" placeholder="https://" defaultValue={defaultValues?.sitio_web ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Input id="ciudad" name="ciudad" defaultValue={defaultValues?.ciudad ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="estado">Estado</Label>
          <Input id="estado" name="estado" defaultValue={defaultValues?.estado ?? ''} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notas">Notas</Label>
          <Textarea id="notas" name="notas" rows={3} defaultValue={defaultValues?.notas ?? ''} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
