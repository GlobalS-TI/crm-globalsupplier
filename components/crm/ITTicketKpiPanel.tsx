'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/crm/dashboard/StatCard'
import { IT_TICKET_PRIORITY_LABELS } from '@/lib/types'
import type { ITTicketKpiSummary } from '@/lib/services/ITTicketService'

const pctFmt = (v: number | null) => v === null ? '—' : `${Math.round(v)}%`
const daysFmt = (v: number | null) => v === null ? '—' : `${v.toFixed(1)} días`

interface Props {
  summary: ITTicketKpiSummary
}

export function ITTicketKpiPanel({ summary }: Props) {
  const chartData = summary.by_priority.map(b => ({
    priority: IT_TICKET_PRIORITY_LABELS[b.priority],
    resueltos: b.resolved_count,
    dias:      b.avg_days_to_resolve ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Eficacia"
          value={pctFmt(summary.overall_eficacia_pct)}
          sub="% resuelto dentro de SLA"
          delay={0}
        />
        <StatCard
          title="Tickets resueltos"
          value={summary.total_resolved}
          delay={60}
        />
        {summary.by_priority.map((b, i) => (
          <StatCard
            key={b.priority}
            title={`${IT_TICKET_PRIORITY_LABELS[b.priority]} — prom. resolución`}
            value={daysFmt(b.avg_days_to_resolve)}
            sub={`${b.resolved_count} resueltos · ${pctFmt(b.within_sla_pct)} en SLA`}
            delay={120 + i * 60}
          />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Tickets resueltos por prioridad</CardTitle>
        </CardHeader>
        <CardContent>
          {summary.total_resolved === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sin tickets resueltos aún.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={32} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="resueltos" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
