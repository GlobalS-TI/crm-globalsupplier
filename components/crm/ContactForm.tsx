'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ContactRow } from '@/lib/repositories/interfaces/IContactRepository'
import type { CompanyRow } from '@/lib/repositories/interfaces/ICompanyRepository'

type ActionState = { error: string } | null

interface Props {
  action:        (prev: ActionState, form: FormData) => Promise<ActionState>
  defaultValues?: Partial<ContactRow>
  companies:     Pick<CompanyRow, 'id' | 'nombre'>[]
  submitLabel?:  string
}

export function ContactForm({ action, defaultValues, companies, submitLabel = 'Guardar' }: Props) {
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
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" required defaultValue={defaultValues?.nombre ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" name="apellido" defaultValue={defaultValues?.apellido ?? ''} />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="company_id">Empresa</Label>
          <Select name="company_id" defaultValue={defaultValues?.company_id ?? 'null'}>
            <SelectTrigger id="company_id">
              <SelectValue placeholder="Sin empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">Sin empresa</SelectItem>
              {companies.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="puesto">Puesto</Label>
          <Input id="puesto" name="puesto" defaultValue={defaultValues?.puesto ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" name="telefono" type="tel" defaultValue={defaultValues?.telefono ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="celular">Celular</Label>
          <Input id="celular" name="celular" type="tel" defaultValue={defaultValues?.celular ?? ''} />
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
