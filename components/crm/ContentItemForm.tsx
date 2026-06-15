'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { ContentItemRow } from '@/lib/repositories/interfaces/IContentRepository'

const BUSINESS_UNITS = [
  { value: 'global_supplier_mty', label: 'Global Supplier MTY' },
  { value: 'thunder_safety',       label: 'Thunder Safety Solutions' },
  { value: 'thunder_led',          label: 'Thunder LED Lights' },
  { value: 'got_fresh_breath',     label: 'Got Fresh Breath' },
  { value: 'gtx_systems',          label: 'GTX Systems' },
  { value: 'juno_promotional',     label: 'Juno Promotional' },
  { value: 'fire_spot',            label: 'Fire Spot' },
]

type ActionState = { error: string } | null

interface Props {
  action:        (prev: ActionState, form: FormData) => Promise<ActionState>
  categoryId?:   string
  defaultValues?: Partial<ContentItemRow>
  submitLabel?:  string
}

export function ContentItemForm({ action, categoryId, defaultValues, submitLabel = 'Guardar' }: Props) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, null)
  const { toast } = useToast()
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state === null) {
      toast({ title: 'Elemento guardado correctamente' })
    }
    wasPending.current = pending
  }, [pending, state, toast])

  return (
    <form action={formAction} className="space-y-4">
      {categoryId && <input type="hidden" name="category_id" value={categoryId} />}

      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" name="nombre" required defaultValue={defaultValues?.nombre ?? ''} />
      </div>

      {!defaultValues && (
        <div className="space-y-1.5">
          <Label htmlFor="business_unit">Marca *</Label>
          <Select name="business_unit" defaultValue="" required>
            <SelectTrigger id="business_unit">
              <SelectValue placeholder="Selecciona una marca" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_UNITS.map(u => (
                <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea id="descripcion" name="descripcion" rows={3} defaultValue={defaultValues?.descripcion ?? ''} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? 'Guardando…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
