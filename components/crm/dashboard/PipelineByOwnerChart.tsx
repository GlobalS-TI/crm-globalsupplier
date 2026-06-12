'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { PipelineByOwner } from '@/lib/repositories/interfaces/IOpportunityRepository'

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 })

interface Props {
  data: PipelineByOwner[]
}

export function PipelineByOwnerChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Sin pipeline activo.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
        <XAxis type="number" tickFormatter={v => fmt.format(Number(v))} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="ownerName" width={100} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(v: unknown) => [fmt.format(Number(v)), 'Pronóstico pond.']}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="amount" fill="hsl(142 71% 45%)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
