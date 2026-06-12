'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { SalesByUnit } from '@/lib/repositories/interfaces/IOpportunityRepository'

const UNIT_LABELS: Record<string, string> = {
  global_supplier_mty: 'Global MTY',
  thunder_safety:      'Thunder Safety',
  thunder_led:         'Thunder LED',
  got_fresh_breath:    'Got Fresh',
  gtx_systems:         'GTX',
  juno_promotional:    'Juno',
  fire_spot:           'Fire Spot',
}

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 })

interface Props {
  data: SalesByUnit[]
}

export function SalesByUnitChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Sin ventas registradas.</p>
  }

  const chartData = data.map(d => ({
    unit:   UNIT_LABELS[d.unit] ?? d.unit,
    amount: d.amount,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="unit" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => fmt.format(Number(v))} tick={{ fontSize: 11 }} width={64} />
        <Tooltip
          formatter={(v: unknown) => [fmt.format(Number(v)), 'Ventas']}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="amount" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
