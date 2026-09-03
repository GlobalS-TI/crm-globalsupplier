'use client'

import * as XLSX from 'xlsx'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { LeadWithRelations } from '@/lib/repositories/interfaces/ILeadRepository'

interface Props {
  leads:       LeadWithRelations[]
  sectionName?: string
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function LeadExportButton({ leads, sectionName }: Props) {
  const { toast } = useToast()

  function handleExport() {
    try {
      const rows = leads.map(lead => ({
        'Nombre':            lead.nombre,
        'Empresa':           lead.empresa ?? '',
        'Numero de contacto': lead.telefono ?? '',
      }))

      const sheet    = XLSX.utils.json_to_sheet(rows)
      sheet['!cols'] = [{ wch: 28 }, { wch: 24 }, { wch: 20 }]

      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, sheet, 'Leads')

      const slug     = sectionName ? slugify(sectionName) : ''
      const filename = `leads${slug ? `-${slug}` : ''}.xlsx`
      XLSX.writeFile(workbook, filename)
    } catch {
      toast({ title: 'Error al exportar', description: 'No se pudo generar el archivo.', variant: 'destructive' })
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={leads.length === 0}>
      <Download className="h-4 w-4 mr-1.5" />
      Exportar
    </Button>
  )
}
