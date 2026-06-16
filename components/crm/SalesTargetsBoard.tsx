'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { SalesTargetsChart } from '@/components/crm/dashboard/SalesTargetsChart'
import { setSalesTarget } from '@/app/(dashboard)/metas/actions'
import type { MonthlyTargetData } from '@/lib/repositories/interfaces/ISalesTargetRepository'

const MONTH_NAMES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

interface Vendor { id: string; full_name: string; role: string }

interface Props {
  vendors:            Vendor[]
  selectedVendedorId: string
  year:               number
  monthlyData:        MonthlyTargetData[]
  isDirector:         boolean
}

export function SalesTargetsBoard({ vendors, selectedVendedorId, year, monthlyData, isDirector }: Props) {
  const router  = useRouter()
  const [data, setData]     = useState<MonthlyTargetData[]>(monthlyData)
  const [, startTransition] = useTransition()

  const pushParams = useCallback((newYear?: number, newVendedor?: string) => {
    const y = newYear    ?? year
    const v = newVendedor ?? selectedVendedorId
    router.push(`/metas?year=${y}&vendedor=${v}`)
  }, [year, selectedVendedorId, router])

  const handleTargetBlur = async (month: number, rawValue: string) => {
    const amount = parseFloat(rawValue.replace(/[^0-9.]/g, '')) || 0
    const prev = data.find(d => d.month === month)
    if (prev?.target === amount) return

    setData(prev => prev.map(d => d.month === month ? { ...d, target: amount } : d))

    startTransition(async () => {
      const result = await setSalesTarget(selectedVendedorId, year, month, amount)
      if (result.error) {
        setData(prev => prev.map(d => d.month === month ? { ...d, target: prev.find(p => p.month === month)?.target ?? 0 } : d))
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {isDirector && (
          <Select value={selectedVendedorId} onValueChange={v => pushParams(undefined, v)}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              {vendors.map(v => (
                <SelectItem key={v.id} value={v.id}>{v.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={String(year)} onValueChange={v => pushParams(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map(y => (
              <SelectItem key={y} value={String(y)}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Meta vs Real por mes — {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTargetsChart data={data} year={year} />
        </CardContent>
      </Card>

      {/* Editable targets grid — directors only */}
      {isDirector && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Definir metas mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {data.map(d => (
                <MonthTargetInput
                  key={d.month}
                  month={d.month}
                  target={d.target}
                  actual={d.actual}
                  onBlur={handleTargetBlur}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Los cambios se guardan al salir del campo.</p>
          </CardContent>
        </Card>
      )}

      {/* Read-only monthly summary for vendedores */}
      {!isDirector && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Detalle mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground text-xs border-b">
                    <th className="pb-2 pr-4">Mes</th>
                    <th className="pb-2 pr-4 text-right">Meta</th>
                    <th className="pb-2 pr-4 text-right">Real</th>
                    <th className="pb-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(d => {
                    const pct = d.target > 0 ? Math.round((d.actual / d.target) * 100) : null
                    return (
                      <tr key={d.month} className="border-b border-muted/50 last:border-0">
                        <td className="py-1.5 pr-4">{MONTH_NAMES[d.month - 1]}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">{fmt.format(d.target)}</td>
                        <td className="py-1.5 pr-4 text-right tabular-nums">{fmt.format(d.actual)}</td>
                        <td className={`py-1.5 text-right font-medium tabular-nums ${pct === null ? 'text-muted-foreground' : pct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
                          {pct !== null ? `${pct}%` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface MonthTargetInputProps {
  month:  number
  target: number
  actual: number
  onBlur: (month: number, value: string) => void
}

function MonthTargetInput({ month, target, actual, onBlur }: MonthTargetInputProps) {
  const [value, setValue] = useState(target > 0 ? String(target) : '')
  const pct = target > 0 ? Math.round((actual / target) * 100) : null

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">{MONTH_NAMES[month - 1]}</label>
      <Input
        type="number"
        min={0}
        step={1000}
        placeholder="0"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={e => onBlur(month, e.target.value)}
        className="h-8 text-sm"
      />
      <div className="text-xs text-muted-foreground">
        Real: {fmt.format(actual)}
        {pct !== null && (
          <span className={`ml-1 font-medium ${pct >= 100 ? 'text-green-600' : 'text-amber-600'}`}>
            ({pct}%)
          </span>
        )}
      </div>
    </div>
  )
}
