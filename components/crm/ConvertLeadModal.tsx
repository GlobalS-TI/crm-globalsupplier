'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { convertLeadToOpportunity } from '@/app/(dashboard)/leads/actions'
import type { LeadWithRelations } from '@/lib/repositories/interfaces/ILeadRepository'
import type { AssignableUser } from '@/components/crm/LeadModal'

type ActionState = { error: string } | null

const BUSINESS_UNITS = [
  { value: 'global_supplier_mty', label: 'Global Supplier MTY' },
  { value: 'thunder_safety',       label: 'Thunder Safety Solutions' },
  { value: 'thunder_led',          label: 'Thunder LED Lights' },
  { value: 'got_fresh_breath',     label: 'Got Fresh Breath' },
  { value: 'gtx_systems',          label: 'GTX Systems' },
  { value: 'juno_promotional',     label: 'Juno Promotional' },
  { value: 'fire_spot',            label: 'Fire Spot' },
]

const LEAD_SOURCES = [
  { value: 'referido',         label: 'Referido' },
  { value: 'web',              label: 'Sitio web' },
  { value: 'linkedin',         label: 'LinkedIn' },
  { value: 'llamada_en_frio',  label: 'Llamada en frío' },
  { value: 'evento',           label: 'Evento' },
  { value: 'alianza',          label: 'Alianza' },
  { value: 'otro',             label: 'Otro' },
]

interface Props {
  lead:            LeadWithRelations
  assignableUsers: AssignableUser[]
}

export function ConvertLeadButton({ lead, assignableUsers }: Props) {
  const [open, setOpen] = useState(false)
  const bound = convertLeadToOpportunity.bind(null, lead.id)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(bound, null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state === null) setOpen(false)
    wasPending.current = pending
  }, [pending, state])

  // Default next_activity_at to tomorrow at 10:00
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const defaultNextActivity = tomorrow.toISOString().slice(0, 16) // datetime-local format

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          title="Convertir a oportunidad"
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convertir a oportunidad</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4 pt-1">
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
          )}

          <p className="text-sm text-muted-foreground">
            Se creará una oportunidad en el pipeline a partir de <strong>{lead.nombre}</strong>.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="cl_nombre">Nombre de la oportunidad *</Label>
            <Input
              id="cl_nombre"
              name="nombre"
              required
              autoFocus
              defaultValue={lead.empresa ? `${lead.empresa} — ${lead.nombre}` : lead.nombre}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cl_unit">Unidad de negocio *</Label>
              <Select name="business_unit" defaultValue={lead.section.business_unit} required>
                <SelectTrigger id="cl_unit">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_UNITS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cl_fuente">Fuente *</Label>
              <Select name="fuente" defaultValue={lead.section.fuente}>
                <SelectTrigger id="cl_fuente">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SOURCES.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cl_owner">Responsable *</Label>
            <Select
              name="owner_id"
              defaultValue={lead.vendedor_id ?? ''}
              required
            >
              <SelectTrigger id="cl_owner">
                <SelectValue placeholder="Selecciona un responsable" />
              </SelectTrigger>
              <SelectContent>
                {assignableUsers.map(u => (
                  <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cl_next">Próxima actividad *</Label>
            <Input
              id="cl_next"
              name="next_activity_at"
              type="datetime-local"
              required
              defaultValue={defaultNextActivity}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cl_notas">Notas</Label>
            <Textarea
              id="cl_notas"
              name="notas"
              rows={2}
              defaultValue={lead.requerimientos ?? ''}
              placeholder="Contexto adicional para el vendedor…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Convirtiendo…' : 'Crear oportunidad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
