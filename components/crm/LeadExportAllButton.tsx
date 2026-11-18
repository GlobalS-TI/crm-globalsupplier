'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { businessDayKey } from '@/lib/utils/date'

// Descarga el Excel de todos los leads de todas las campañas, generado por
// app/(dashboard)/leads/export/route.ts. Se usa fetch (y no un <a href download>) para
// poder mostrar estado de carga y un toast si el servidor responde con error.
export function LeadExportAllButton() {
  const { toast }  = useToast()
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch('/leads/export', { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())

      const url  = URL.createObjectURL(await res.blob())
      const link = document.createElement('a')
      link.href     = url
      link.download = `leads-todas-las-campanas-${businessDayKey(new Date())}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      toast({ title: 'Error al exportar', description: 'No se pudo generar el archivo.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      {loading
        ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        : <Download className="h-4 w-4 mr-1.5" />}
      Exportar todos
    </Button>
  )
}
