import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/crm/dashboard/StatCard'
import { formatMXN } from '@/lib/utils/currency'
import type { IndicatorBreakdown, OpportunityReportIndicators } from '@/lib/services/OpportunityReportService'

const fmtPct = new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 })

function formatConversion(value: number | null): string {
  return value === null ? '—' : fmtPct.format(value)
}

interface BreakdownTableProps {
  title:      string
  groupLabel: string
  rows:       IndicatorBreakdown[]
}

function BreakdownTable({ title, groupLabel, rows }: BreakdownTableProps) {
  const maxPipeline = Math.max(...rows.map(r => r.pipelineMxn), 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Sin datos con estos filtros.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{groupLabel}</TableHead>
                <TableHead className="text-right">Abiertas</TableHead>
                <TableHead className="min-w-40">Pipeline</TableHead>
                <TableHead className="text-right">Ponderado</TableHead>
                <TableHead className="text-right">Ganadas</TableHead>
                <TableHead className="text-right">Monto ganado</TableHead>
                <TableHead className="text-right">Perdidas</TableHead>
                <TableHead className="text-right">Conversión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium whitespace-nowrap">{r.label}</TableCell>
                  <TableCell className="text-right">{r.abiertas}</TableCell>
                  <TableCell>
                    <div className="text-right font-medium whitespace-nowrap">{formatMXN(r.pipelineMxn)}</div>
                    {maxPipeline > 0 && (
                      <div className="mt-1 h-1.5 rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(r.pipelineMxn / maxPipeline) * 100}%` }}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground whitespace-nowrap">{formatMXN(r.ponderadoMxn)}</TableCell>
                  <TableCell className="text-right">{r.ganadas}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{formatMXN(r.ganadoMxn)}</TableCell>
                  <TableCell className="text-right">{r.perdidas}</TableCell>
                  <TableCell className="text-right font-medium">{formatConversion(r.conversion)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

interface OpportunityReportIndicatorsPanelProps {
  indicators: OpportunityReportIndicators
}

export function OpportunityReportIndicatorsPanel({ indicators: k }: OpportunityReportIndicatorsPanelProps) {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Pipeline y seguimiento</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Oportunidades abiertas"
            value={k.abiertas.count}
            sub={`${formatMXN(k.abiertas.pipelineMxn)} en pipeline`}
          />
          <StatCard
            title="Pipeline ponderado"
            value={formatMXN(k.abiertas.ponderadoMxn)}
            sub="monto × probabilidad"
          />
          <StatCard
            title="Cotizaciones enviadas"
            value={k.cotizacionesEnviadas.count}
            sub={`${formatMXN(k.cotizacionesEnviadas.montoMxn)} pendientes de respuesta`}
          />
          <StatCard
            title="Sin seguimiento"
            value={k.sinSeguimiento}
            sub="abiertas sin actividad agendada"
            className={k.sinSeguimiento > 0 ? 'border-amber-500' : undefined}
          />
          <StatCard
            title="Seguimientos vencidos"
            value={k.seguimientosVencidos}
            sub="actividad pendiente atrasada"
            className={k.seguimientosVencidos > 0 ? 'border-destructive' : undefined}
          />
          <StatCard
            title="Sin actividad"
            value={k.sinActividad}
            sub="7+ días sin movimiento"
            className={k.sinActividad > 0 ? 'border-destructive' : undefined}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Resultados</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Ventas ganadas"
            value={k.ganadas.count}
            sub={formatMXN(k.ganadas.montoMxn)}
          />
          <StatCard
            title="Ventas perdidas"
            value={k.perdidas.count}
            sub={`${formatMXN(k.perdidas.montoMxn)} estimado · incluye ${k.perdidas.sinRespuesta} sin respuesta`}
          />
          <StatCard
            title="Conversión"
            value={formatConversion(k.conversion)}
            sub="ganadas ÷ cerradas (ganadas + perdidas)"
          />
        </div>
      </section>

      <BreakdownTable title="Por unidad de negocio" groupLabel="Unidad"   rows={k.porUnidad} />
      <BreakdownTable title="Por vendedor"          groupLabel="Vendedor" rows={k.porVendedor} />
    </div>
  )
}
