'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { ActionState } from '@/app/(dashboard)/oportunidades/actions'
import type { OpportunityRow } from '@/lib/repositories/interfaces/IOpportunityRepository'

const STAGES = [
  { value: 'nuevo_lead',         label: 'Nuevo lead' },
  { value: 'contactado',         label: 'Contactado' },
  { value: 'diagnostico',        label: 'Diagnóstico' },
  { value: 'cotizacion_enviada', label: 'Cotización enviada' },
  { value: 'seguimiento',        label: 'Seguimiento' },
  { value: 'negociacion',        label: 'Negociación' },
  { value: 'ganado',             label: 'Ganado' },
  { value: 'perdido',            label: 'Perdido' },
]

const SOURCES = [
  { value: 'referido',       label: 'Referido' },
  { value: 'web',            label: 'Web' },
  { value: 'linkedin',       label: 'LinkedIn' },
  { value: 'llamada_en_frio', label: 'Llamada en frío' },
  { value: 'evento',         label: 'Evento' },
  { value: 'alianza',        label: 'Alianza' },
  { value: 'otro',           label: 'Otro' },
]

const UNITS = [
  { value: 'global_supplier_mty', label: 'Global Supplier MTY' },
  { value: 'thunder_safety',      label: 'Thunder Safety' },
  { value: 'thunder_led',         label: 'Thunder LED' },
  { value: 'got_fresh_breath',    label: 'Got Fresh Breath' },
  { value: 'gtx_systems',         label: 'GTX Systems' },
  { value: 'juno_promotional',    label: 'Juno Promotional' },
  { value: 'fire_spot',           label: 'Fire Spot' },
]

interface Profile { id: string; full_name: string }
interface Company { id: string; nombre: string }

interface OpportunityFormProps {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
  defaultValues?: Partial<OpportunityRow>
  profiles: Profile[]
  companies: Company[]
  currentUserId: string
  submitLabel?: string
}

export function OpportunityForm({
  action, defaultValues: d = {}, profiles, companies, currentUserId, submitLabel = 'Guardar',
}: OpportunityFormProps) {
  const [state, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-5">
      {/* Nombre */}
      <div className="space-y-1.5">
        <Label htmlFor="nombre">Nombre *</Label>
        <Input id="nombre" name="nombre" required defaultValue={d.nombre ?? ''} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Business unit */}
        <div className="space-y-1.5">
          <Label>Unidad de negocio *</Label>
          <Select name="business_unit" defaultValue={d.business_unit ?? ''} required>
            <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Fuente */}
        <div className="space-y-1.5">
          <Label>Fuente *</Label>
          <Select name="fuente" defaultValue={d.fuente ?? ''} required>
            <SelectTrigger><SelectValue placeholder="Selecciona…" /></SelectTrigger>
            <SelectContent>
              {SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Etapa */}
        <div className="space-y-1.5">
          <Label>Etapa</Label>
          <Select name="etapa" defaultValue={d.etapa ?? 'nuevo_lead'}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Dueño */}
        <div className="space-y-1.5">
          <Label>Vendedor *</Label>
          <Select name="owner_id" defaultValue={d.owner_id ?? currentUserId} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Empresa */}
        <div className="space-y-1.5">
          <Label>Empresa</Label>
          <Select name="company_id" defaultValue={d.company_id ?? 'null'}>
            <SelectTrigger><SelectValue placeholder="Sin empresa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="null">— Sin empresa —</SelectItem>
              {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Probabilidad */}
        <div className="space-y-1.5">
          <Label htmlFor="probabilidad">Probabilidad (%)</Label>
          <Input
            id="probabilidad" name="probabilidad" type="number"
            min={0} max={100} defaultValue={d.probabilidad ?? 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Monto estimado */}
        <div className="space-y-1.5">
          <Label htmlFor="monto_estimado">Monto estimado (MXN)</Label>
          <Input
            id="monto_estimado" name="monto_estimado" type="number"
            min={0} step="0.01" defaultValue={d.monto_estimado ?? 0}
          />
        </div>

        {/* Monto final */}
        <div className="space-y-1.5">
          <Label htmlFor="monto_final">Monto final (MXN)</Label>
          <Input
            id="monto_final" name="monto_final" type="number"
            min={0} step="0.01" defaultValue={d.monto_final ?? ''}
            placeholder="Solo para oportunidades ganadas"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Fecha cierre estimada */}
        <div className="space-y-1.5">
          <Label htmlFor="fecha_cierre_estimada">Cierre estimado</Label>
          <Input
            id="fecha_cierre_estimada" name="fecha_cierre_estimada" type="date"
            defaultValue={d.fecha_cierre_estimada ?? ''}
          />
        </div>

        {/* Próxima actividad */}
        <div className="space-y-1.5">
          <Label htmlFor="next_activity_at">Próxima actividad</Label>
          <Input
            id="next_activity_at" name="next_activity_at" type="datetime-local"
            defaultValue={d.next_activity_at ? d.next_activity_at.slice(0, 16) : ''}
          />
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-1.5">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" name="notas" rows={3} defaultValue={d.notas ?? ''} />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Guardando…' : submitLabel}
      </Button>
    </form>
  )
}
