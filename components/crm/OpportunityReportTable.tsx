import Link from 'next/link'
import type { Route } from 'next'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { StaleBadge } from '@/components/crm/StaleBadge'
import { ActivityStatusBadge } from '@/components/crm/ActivityStatusBadge'
import { formatDualCurrency } from '@/lib/utils/currency'
import { formatBusinessDate } from '@/lib/utils/date'
import {
  BRAND_LABELS, LEAD_SOURCE_LABELS, OPPORTUNITY_STAGE_LABELS, REPORT_STATUS_LABELS,
} from '@/lib/types'
import type { OpportunityReportRow } from '@/lib/services/OpportunityReportService'

interface OpportunityReportTableProps {
  rows: OpportunityReportRow[]
}

export function OpportunityReportTable({ rows }: OpportunityReportTableProps) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No hay oportunidades con estos filtros.
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Oportunidad</TableHead>
            <TableHead>Empresa / contacto</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Etapa</TableHead>
            <TableHead className="text-right">Monto estimado</TableHead>
            <TableHead>Creada</TableHead>
            <TableHead>Última actividad</TableHead>
            <TableHead>Próximo seguimiento</TableHead>
            <TableHead>Cierre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Origen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell className="min-w-48">
                <Link href={`/oportunidades/${row.id}` as Route} className="font-medium hover:underline">
                  {row.oportunidad}
                </Link>
                {row.sinActividad && <span className="ml-2 inline-flex"><StaleBadge /></span>}
              </TableCell>
              <TableCell className="min-w-40">
                <div>{row.empresa ?? '—'}</div>
                {row.contacto && <div className="text-xs text-muted-foreground">{row.contacto}</div>}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{BRAND_LABELS[row.unidad]}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{row.vendedor ?? '—'}</TableCell>
              <TableCell>
                <Badge variant={row.estado === 'abierta' ? 'outline' : 'secondary'} className="text-xs whitespace-nowrap">
                  {OPPORTUNITY_STAGE_LABELS[row.etapa]}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium whitespace-nowrap">
                {row.montoEstimado > 0
                  ? formatDualCurrency(row.montoEstimado, row.moneda, row.montoEstimadoMxn)
                  : '—'}
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{formatBusinessDate(row.creadaEl)}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{row.ultimaActividadEl ? formatBusinessDate(row.ultimaActividadEl) : '—'}</TableCell>
              <TableCell className="whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {row.proximoSeguimientoEl ? formatBusinessDate(row.proximoSeguimientoEl) : '—'}
                  </span>
                  {row.estado === 'abierta' && <ActivityStatusBadge nextActivityAt={row.proximoSeguimientoEl} />}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{row.cerradaEl ? formatBusinessDate(row.cerradaEl) : '—'}</TableCell>
              <TableCell className="whitespace-nowrap">{REPORT_STATUS_LABELS[row.estado]}</TableCell>
              <TableCell className="text-muted-foreground whitespace-nowrap">{LEAD_SOURCE_LABELS[row.origen]}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
