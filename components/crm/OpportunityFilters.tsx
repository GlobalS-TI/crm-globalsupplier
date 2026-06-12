'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { Route } from 'next'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

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

interface OpportunityFiltersProps {
  profiles: Profile[]
}

export function OpportunityFilters({ profiles }: OpportunityFiltersProps) {
  const router     = useRouter()
  const pathname   = usePathname()
  const params     = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value === 'all') next.delete(key)
    else next.set(key, value)
    router.push(`${pathname}?${next.toString()}` as Route)
  }, [params, pathname, router])

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Vendedor */}
      <Select
        value={params.get('owner') ?? 'all'}
        onValueChange={v => update('owner', v)}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="Vendedor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los vendedores</SelectItem>
          {profiles.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Unidad de negocio */}
      <Select
        value={params.get('unit') ?? 'all'}
        onValueChange={v => update('unit', v)}
      >
        <SelectTrigger className="h-8 w-48 text-xs">
          <SelectValue placeholder="Unidad de negocio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las unidades</SelectItem>
          {UNITS.map(u => (
            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Etapa */}
      <Select
        value={params.get('stage') ?? 'all'}
        onValueChange={v => update('stage', v)}
      >
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="Etapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las etapas</SelectItem>
          {STAGES.map(s => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Solo vencidas */}
      <Select
        value={params.get('stale') ?? 'all'}
        onValueChange={v => update('stale', v)}
      >
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas</SelectItem>
          <SelectItem value="true">Sin actividad</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
