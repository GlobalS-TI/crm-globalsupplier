'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import type { ForecastByStage } from '@/lib/repositories/interfaces/IOpportunityRepository'

const STAGE_LABELS: Record<string, string> = {
  nuevo_lead:          'Nuevo Lead',
  contactado:          'Contactado',
  diagnostico:         'Diagnóstico',
  cotizacion_enviada:  'Cotización',
  seguimiento:         'Seguimiento',
  negociacion:         'Negociación',
}

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 })

interface Props {
  data: ForecastByStage[]
}

export function ForecastChart({ data }: Props) {
  if (!data.length) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Sin oportunidades abiertas.</p>
  }

  const chartData = data.map(d => ({
    stage:    STAGE_LABELS[d.stage] ?? d.stage,
    Potencial: d.amount,
    Pronóstico: Math.round(d.weighted),
    count:    d.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => fmt.format(Number(v))} tick={{ fontSize: 11 }} width={64} />
        <Tooltip
          formatter={(v: unknown) => fmt.format(Number(v))}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Potencial"   fill="hsl(221 83% 75%)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="Pronóstico"  fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
