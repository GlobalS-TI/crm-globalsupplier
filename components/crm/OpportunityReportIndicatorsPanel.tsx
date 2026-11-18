import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/crm/dashboard/StatCard'
import { formatMXN } from '@/lib/utils/currency'
import type { IndicatorBreakdown, OpportunityReportIndicators } from '@/lib/services/OpportunityReportService'
import type { ReportDateField } from '@/lib/validations/report'

const fmtPct = new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 0 })

function formatConversion(value: number | null): string {
  return value === null ? '—' : fmtPct.format(value)
}

// Con fecha de cierre, lo cerrado es lo del rango y lo abierto es el pipeline de hoy.
// Con fecha de creación, ambas partes son de las oportunidades creadas en el rango.
const SECTION_TITLES: Record<ReportDateField, { cerrado: string; abierto: string }> = {
  cierre:   { cerrado: 'Cerrado en el periodo',                abierto: 'Pipeline abierto al día de hoy' },
  creacion: { cerrado: 'Creadas en el periodo · ya cerradas',  abierto: 'Creadas en el periodo · siguen abiertas' },
}

interface BreakdownTableProps {
  title:      string
  groupLabel: string
  rows:       IndicatorBreakdown[]
  titles:     { cerrado: string; abierto: string }
}

function BreakdownTable({ title, groupLabel, rows, titles }: BreakdownTableProps) {
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
              <TableRow className="hover:bg-transparent">
                <TableHead />
                <TableHead colSpan={4} className="text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-l">
                  {titles.cerrado}
                </TableHead>
                <TableHead colSpan={3} className="text-center text-xs font-semibold text-primary border-l">
                  {titles.abierto}
                </TableHead>
              </TableRow>
              <TableRow>
                <TableHead>{groupLabel}</TableHead>
                <TableHead className="text-right border-l">Ganadas</TableHead>
                <TableHead className="text-right">Monto ganado</TableHead>
                <TableHead className="text-right">Perdidas</TableHead>
                <TableHead className="text-right">Conversión</TableHead>
                <TableHead className="text-right border-l">Abiertas</TableHead>
                <TableHead className="min-w-40">Pipeline</TableHead>
                <TableHead className="text-right">Ponderado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.key}>
                  <TableCell className="font-medium whitespace-nowrap">{r.label}</TableCell>
                  <TableCell className="text-right border-l">{r.ganadas}</TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">{formatMXN(r.ganadoMxn)}</TableCell>
                  <TableCell className="text-right">{r.perdidas}</TableCell>
                  <TableCell className="text-right font-medium">{formatConversion(r.conversion)}</TableCell>
                  <TableCell className="text-right border-l">{r.abiertas}</TableCell>
                  <TableCell>
                    <div className="text-right whitespace-nowrap">{formatMXN(r.pipelineMxn)}</div>
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
  fecha:      ReportDateField
}

export function OpportunityReportIndicatorsPanel({ indicators: k, fecha }: OpportunityReportIndicatorsPanelProps) {
  const titles = SECTION_TITLES[fecha]

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3 uppercase tracking-wide">{titles.cerrado}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Ventas ganadas"
            value={formatMXN(k.ganadas.montoMxn)}
            sub={`${k.ganadas.count} oportunidad${k.ganadas.count !== 1 ? 'es' : ''} ganada${k.ganadas.count !== 1 ? 's' : ''}`}
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

      <section>
        <h2 className="text-xs font-semibold text-primary mb-3 uppercase tracking-wide">{titles.abierto}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            title="Oportunidades abiertas"
            value={k.abiertas.count}
            sub={`${formatMXN(k.abiertas.pipelineMxn)} en pipeline · no es venta`}
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

      <BreakdownTable title="Por vendedor"          groupLabel="Vendedor" rows={k.porVendedor} titles={titles} />
      <BreakdownTable title="Por unidad de negocio" groupLabel="Unidad"   rows={k.porUnidad}   titles={titles} />
    </div>
  )
}
