'use client'

import * as XLSX from 'xlsx'
import Papa from 'papaparse'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  BRAND_LABELS, LEAD_SOURCE_LABELS, OPPORTUNITY_STAGE_LABELS, REPORT_STATUS_LABELS,
} from '@/lib/types'
import { FOLLOW_UP_LABELS } from '@/lib/utils/followUp'
import { businessDayKey, formatBusinessDateTime } from '@/lib/utils/date'
import type { OpportunityReportRow } from '@/lib/services/OpportunityReportService'

// Orden de columnas = orden del encabezado en Excel y CSV.
function toExportRecord(row: OpportunityReportRow) {
  return {
    'Empresa':                  row.empresa ?? '',
    'Contacto':                 row.contacto ?? '',
    'Email contacto':           row.contactoEmail ?? '',
    'Teléfono contacto':        row.contactoTelefono ?? '',
    'Unidad de negocio':        BRAND_LABELS[row.unidad],
    'Oportunidad':              row.oportunidad,
    'Vendedor':                 row.vendedor ?? '',
    'Etapa':                    OPPORTUNITY_STAGE_LABELS[row.etapa],
    'Monto estimado':           row.montoEstimado,
    'Moneda':                   row.moneda,
    'Monto estimado (MXN)':     row.montoEstimadoMxn,
    'Fecha de creación':        formatBusinessDateTime(row.creadaEl),
    'Última actividad':         formatBusinessDateTime(row.ultimaActividadEl),
    'Próximo seguimiento':      row.proximoSeguimientoEl ? formatBusinessDateTime(row.proximoSeguimientoEl) : '',
    'Estado':                   REPORT_STATUS_LABELS[row.estado],
    'Seguimiento':              row.seguimiento ? FOLLOW_UP_LABELS[row.seguimiento] : '',
    'Sin actividad (7+ días)':  row.sinActividad ? 'Sí' : 'No',
    'Origen':                   LEAD_SOURCE_LABELS[row.origen],
  }
}

const COLUMN_WIDTHS = [28, 24, 28, 16, 22, 32, 22, 18, 14, 8, 18, 17, 17, 19, 13, 15, 10, 16]

function downloadBlob(blob: Blob, filename: string) {
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

interface Props {
  rows: OpportunityReportRow[]
}

// Exporta exactamente las filas que la página ya cargó con los filtros activos — no
// vuelve a consultar, así que lo descargado siempre coincide con lo que se ve.
export function OpportunityReportExportButtons({ rows }: Props) {
  const { toast } = useToast()
  const baseName  = `reporte-oportunidades-${businessDayKey(new Date())}`

  function exportExcel() {
    try {
      const sheet    = XLSX.utils.json_to_sheet(rows.map(toExportRecord))
      sheet['!cols'] = COLUMN_WIDTHS.map(wch => ({ wch }))

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, 'Oportunidades')
      XLSX.writeFile(workbook, `${baseName}.xlsx`)
    } catch {
      toast({ title: 'Error al exportar', description: 'No se pudo generar el archivo.', variant: 'destructive' })
    }
  }

  function exportCsv() {
    try {
      // BOM para que Excel abra el CSV como UTF-8 (acentos y ñ).
      const csv = '﻿' + Papa.unparse(rows.map(toExportRecord))
      downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `${baseName}.csv`)
    } catch {
      toast({ title: 'Error al exportar', description: 'No se pudo generar el archivo.', variant: 'destructive' })
    }
  }

  const disabled = rows.length === 0

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={exportExcel} disabled={disabled}>
        <Download className="h-4 w-4 mr-1.5" />
        Excel
      </Button>
      <Button variant="outline" size="sm" onClick={exportCsv} disabled={disabled}>
        <Download className="h-4 w-4 mr-1.5" />
        CSV
      </Button>
    </div>
  )
}
