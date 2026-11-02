'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import type { Route } from 'next'
import { X } from 'lucide-react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  BUSINESS_UNITS, BRAND_LABELS, OPPORTUNITY_STAGES, OPPORTUNITY_STAGE_LABELS,
  REPORT_STATUS_LABELS, REPORT_ALERT_LABELS,
} from '@/lib/types'
import type { ReportAlert, ReportStatus } from '@/lib/validations/report'

const FILTER_KEYS = ['desde', 'hasta', 'owner', 'unit', 'stage', 'estado', 'alerta'] as const

interface Profile { id: string; full_name: string }

interface OpportunityReportFiltersProps {
  profiles:         Profile[]
  canFilterByOwner: boolean
}

export function OpportunityReportFilters({ profiles, canFilterByOwner }: OpportunityReportFiltersProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value === 'all' || value === '') next.delete(key)
    else next.set(key, value)
    router.push(`${pathname}?${next.toString()}` as Route)
  }, [params, pathname, router])

  const hasFilters = FILTER_KEYS.some(k => params.has(k))
  const desde      = params.get('desde') ?? ''
  const hasta      = params.get('hasta') ?? ''

  return (
    <div className="flex items-end gap-2 flex-wrap">
      {/* Fecha de creación */}
      <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
        Creada desde
        <Input
          type="date"
          className="h-8 w-36 text-xs"
          value={desde}
          max={hasta || undefined}
          onChange={e => update('desde', e.target.value)}
        />
      </label>
      <label className="flex flex-col gap-1 text-[11px] text-muted-foreground">
        Hasta
        <Input
          type="date"
          className="h-8 w-36 text-xs"
          value={hasta}
          min={desde || undefined}
          onChange={e => update('hasta', e.target.value)}
        />
      </label>

      {/* Vendedor — sólo dirección (REPORT_OWNER_FILTER_ROLES). RLS es la seguridad real. */}
      {canFilterByOwner && (
        <Select value={params.get('owner') ?? 'all'} onValueChange={v => update('owner', v)}>
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
      )}

      <Select value={params.get('unit') ?? 'all'} onValueChange={v => update('unit', v)}>
        <SelectTrigger className="h-8 w-48 text-xs">
          <SelectValue placeholder="Unidad de negocio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las unidades</SelectItem>
          {BUSINESS_UNITS.map(u => (
            <SelectItem key={u} value={u}>{BRAND_LABELS[u]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get('stage') ?? 'all'} onValueChange={v => update('stage', v)}>
        <SelectTrigger className="h-8 w-44 text-xs">
          <SelectValue placeholder="Etapa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las etapas</SelectItem>
          {OPPORTUNITY_STAGES.map(s => (
            <SelectItem key={s} value={s}>{OPPORTUNITY_STAGE_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get('estado') ?? 'all'} onValueChange={v => update('estado', v)}>
        <SelectTrigger className="h-8 w-40 text-xs">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map(s => (
            <SelectItem key={s} value={s}>{REPORT_STATUS_LABELS[s]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get('alerta') ?? 'all'} onValueChange={v => update('alerta', v)}>
        <SelectTrigger className="h-8 w-56 text-xs">
          <SelectValue placeholder="Seguimiento" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Cualquier seguimiento</SelectItem>
          {(Object.keys(REPORT_ALERT_LABELS) as ReportAlert[]).map(a => (
            <SelectItem key={a} value={a}>{REPORT_ALERT_LABELS[a]}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => router.push(pathname as Route)}
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Limpiar
        </Button>
      )}
    </div>
  )
}
