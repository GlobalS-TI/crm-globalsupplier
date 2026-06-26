'use client'

import { useState, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { saveCosto } from '@/app/(dashboard)/comisiones/actions'
import type { ComisionRow, ComisionesSummary } from '@/lib/services/ComisionesService'

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })
const PCT = new Intl.NumberFormat('es-MX', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })

const BRAND_LABELS: Record<string, string> = {
  global_supplier_mty: 'Global Supplier',
  thunder_safety:      'Thunder Safety',
  thunder_led:         'Thunder LED',
  got_fresh_breath:    'Got Fresh Breath',
  gtx_systems:         'GTX Systems',
  juno_promotional:    'Juno Promotional',
  fire_spot:           'The Fire Spot',
}

function KpiCard({ title, value, icon: Icon, sub, highlight }: {
  title: string
  value: string
  icon: React.ElementType
  sub?: string
  highlight?: 'positive' | 'negative'
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${highlight === 'positive' ? 'text-green-600 dark:text-green-400' : highlight === 'negative' ? 'text-red-600 dark:text-red-400' : ''}`}>
          {value}
        </p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

function CostoCell({ row }: { row: ComisionRow }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(row.costo ?? ''))
  const inputRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  function startEdit() {
    setValue(String(row.costo ?? ''))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  async function commit() {
    const num = parseFloat(value.replace(/,/g, ''))
    if (isNaN(num) || num < 0) {
      setValue(String(row.costo ?? ''))
      setEditing(false)
      return
    }
    if (num === (row.costo ?? 0)) {
      setEditing(false)
      return
    }
    startTransition(async () => {
      const res = await saveCosto(row.id, num)
      if (res.error) {
        toast({ title: 'Error al guardar', description: res.error, variant: 'destructive' })
        setValue(String(row.costo ?? ''))
      } else {
        router.refresh()
      }
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <Input
        ref={inputRef}
        type="number"
        min={0}
        step={0.01}
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setValue(String(row.costo ?? '')); setEditing(false) } }}
        className="h-7 w-36 text-right text-sm"
        disabled={isPending}
        autoFocus
      />
    )
  }

  return (
    <button
      onClick={startEdit}
      className="w-full text-right text-sm rounded px-2 py-0.5 hover:bg-accent transition-colors min-w-[7rem] inline-block"
      title="Click para editar"
    >
      {row.costo != null ? MXN.format(row.costo) : <span className="text-muted-foreground italic">— añadir</span>}
    </button>
  )
}

interface Props {
  rows: ComisionRow[]
  summary: ComisionesSummary
  year: number
  years: number[]
}

export function ComisionesTable({ rows, summary, year, years }: Props) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      {/* Year filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Año:</span>
        <div className="flex gap-1">
          {years.map(y => (
            <button
              key={y}
              onClick={() => router.push(`/comisiones?year=${y}`)}
              className={`px-3 py-1 text-sm rounded-md font-medium transition-colors ${y === year ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground hover:bg-accent/80'}`}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Ventas"
          value={MXN.format(summary.total_venta)}
          icon={DollarSign}
          sub={`${rows.length} oportunidades ganadas`}
        />
        <KpiCard
          title="Total Costos"
          value={MXN.format(summary.total_costo)}
          icon={DollarSign}
          sub={`${rows.filter(r => r.costo != null).length} con costo registrado`}
        />
        <KpiCard
          title="Utilidad Bruta"
          value={MXN.format(summary.utilidad_bruta)}
          icon={summary.utilidad_bruta >= 0 ? TrendingUp : TrendingDown}
          highlight={summary.utilidad_bruta >= 0 ? 'positive' : 'negative'}
        />
        <KpiCard
          title="Margen"
          value={summary.margen_promedio != null ? PCT.format(summary.margen_promedio / 100) : '—'}
          icon={Percent}
          highlight={
            summary.margen_promedio == null ? undefined
            : summary.margen_promedio >= 0 ? 'positive' : 'negative'
          }
          sub="sobre ventas totales"
        />
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          No hay oportunidades ganadas en {year}.
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Oportunidad</th>
                <th className="text-left px-4 py-3 font-medium">Empresa</th>
                <th className="text-left px-4 py-3 font-medium">Vendedor</th>
                <th className="text-left px-4 py-3 font-medium">Marca</th>
                <th className="text-left px-4 py-3 font-medium">Mes cierre</th>
                <th className="text-right px-4 py-3 font-medium">Venta</th>
                <th className="text-right px-4 py-3 font-medium">Costo</th>
                <th className="text-right px-4 py-3 font-medium">Utilidad</th>
                <th className="text-right px-4 py-3 font-medium">Margen</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const month = new Date(row.updated_at).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
                const utilidad = row.costo != null ? row.utilidad : null
                const margen   = row.costo != null ? row.margen : null
                return (
                  <tr key={row.id} className={`border-b transition-colors hover:bg-muted/30 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{row.nombre}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.company_nombre ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.owner_full_name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">
                        {BRAND_LABELS[row.business_unit] ?? row.business_unit}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{month}</td>
                    <td className="px-4 py-3 text-right font-mono">{MXN.format(row.monto_final)}</td>
                    <td className="px-4 py-3 text-right">
                      <CostoCell row={row} />
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${utilidad == null ? 'text-muted-foreground' : utilidad >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {utilidad != null ? MXN.format(utilidad) : '—'}
                    </td>
                    <td className={`px-4 py-3 text-right ${margen == null ? 'text-muted-foreground' : margen >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {margen != null ? PCT.format(margen / 100) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {rows.length > 1 && (
              <tfoot>
                <tr className="border-t bg-muted/30 font-semibold">
                  <td colSpan={5} className="px-4 py-3 text-sm">Total</td>
                  <td className="px-4 py-3 text-right font-mono">{MXN.format(summary.total_venta)}</td>
                  <td className="px-4 py-3 text-right font-mono">{MXN.format(summary.total_costo)}</td>
                  <td className={`px-4 py-3 text-right font-mono ${summary.utilidad_bruta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {MXN.format(summary.utilidad_bruta)}
                  </td>
                  <td className={`px-4 py-3 text-right ${(summary.margen_promedio ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {summary.margen_promedio != null ? PCT.format(summary.margen_promedio / 100) : '—'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}
