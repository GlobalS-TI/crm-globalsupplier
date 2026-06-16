'use client'

import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend, ReferenceLine,
} from 'recharts'
import type { MonthlyTargetData } from '@/lib/repositories/interfaces/ISalesTargetRepository'

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const fmt = new Intl.NumberFormat('es-MX', {
  style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1,
})

interface Props {
  data: MonthlyTargetData[]
  year: number
}

export function SalesTargetsChart({ data, year }: Props) {
  const chartData = data.map(d => ({
    mes:    MONTH_LABELS[d.month - 1],
    Meta:   d.target,
    Real:   d.actual,
  }))

  const totalTarget = data.reduce((s, d) => s + d.target, 0)
  const totalActual = data.reduce((s, d) => s + d.actual, 0)
  const pct = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : null

  return (
    <div className="space-y-3">
      {/* Summary row */}
      <div className="flex gap-6 text-sm">
        <span className="text-muted-foreground">
          Meta anual: <span className="font-semibold text-foreground">{fmt.format(totalTarget)}</span>
        </span>
        <span className="text-muted-foreground">
          Real {year}: <span className="font-semibold text-foreground">{fmt.format(totalActual)}</span>
        </span>
        {pct !== null && (
          <span className={pct >= 100 ? 'font-semibold text-green-600' : 'font-semibold text-amber-600'}>
            {pct}% de la meta
          </span>
        )}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
          <YAxis tickFormatter={v => fmt.format(Number(v))} tick={{ fontSize: 11 }} width={68} />
          <Tooltip
            formatter={(v: unknown) => fmt.format(Number(v))}
            contentStyle={{ fontSize: 12 }}
          />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Meta" fill="hsl(220 14% 75%)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Real" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
