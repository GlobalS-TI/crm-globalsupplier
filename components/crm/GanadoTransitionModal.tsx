'use client'

import { useEffect, useState, useTransition } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { FileDropzone } from '@/components/crm/FileDropzone'
import { createClient } from '@/lib/supabase/client'
import { kanbanMoveToStage, listOpportunityFiles, addOpportunityFile } from '@/app/(dashboard)/oportunidades/actions'
import type { OpportunityFileRow } from '@/lib/repositories/interfaces/IOpportunityFileRepository'
import type { OpportunityFileCategoria } from '@/lib/validations/opportunityFile'

interface Props {
  open:             boolean
  oppId:            string
  oppName:          string
  moneda?:          'MXN' | 'USD'
  cotizacionPath?:  string | null
  ordenCompraPath?: string | null
  onConfirm: () => void
  onCancel:  () => void
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
}

export function GanadoTransitionModal({
  open, oppId, oppName, moneda = 'MXN', cotizacionPath, ordenCompraPath, onConfirm, onCancel,
}: Props) {
  const [monto,      setMonto]      = useState('')
  const [tipoCambio, setTipoCambio] = useState('')
  const [files, setFiles]           = useState<OpportunityFileRow[]>([])
  const [loadingFiles, setLoadingFiles]   = useState(false)
  const [selectedCotizacion,  setSelectedCotizacion]  = useState<OpportunityFileRow | null>(null)
  const [selectedOrdenCompra, setSelectedOrdenCompra] = useState<OpportunityFileRow | null>(null)
  const [error, setError]   = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const isUsd = moneda === 'USD'

  useEffect(() => {
    if (!open) return
    setLoadingFiles(true)
    listOpportunityFiles(oppId).then(list => {
      setFiles(list)
      setSelectedCotizacion(list.find(f => f.file_path === cotizacionPath) ?? null)
      setSelectedOrdenCompra(list.find(f => f.file_path === ordenCompraPath) ?? null)
      setLoadingFiles(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, oppId])

  const canConfirm =
    monto && parseFloat(monto) > 0
    && (!isUsd || (tipoCambio && parseFloat(tipoCambio) > 0))
    && selectedCotizacion && selectedOrdenCompra

  async function uploadInline(
    file: File,
    categoria: OpportunityFileCategoria,
    onDone: (f: OpportunityFileRow) => void,
  ) {
    setError(null)
    const ext  = file.name.split('.').pop() ?? 'pdf'
    const base = sanitize(file.name.replace(`.${ext}`, ''))
    const path = `opportunity-docs/${oppId}/${categoria}-${Date.now()}-${base}.${ext}`

    const supabase = createClient()
    const { error: storageErr } = await supabase.storage
      .from('media')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (storageErr) {
      setError(`Error al subir archivo: ${storageErr.message}`)
      return
    }

    const result = await addOpportunityFile({
      opportunity_id: oppId,
      nombre:         file.name,
      file_path:      path,
      mime_type:      file.type || undefined,
      file_size:      file.size || undefined,
      categoria,
    })
    if (result.error) {
      setError(result.error)
      return
    }

    const list = await listOpportunityFiles(oppId)
    setFiles(list)
    const created = list.find(f => f.file_path === path)
    if (created) onDone(created)
  }

  function handleConfirm() {
    if (!canConfirm) return
    const montoVal = parseFloat(monto)
    startTransition(async () => {
      const result = await kanbanMoveToStage(oppId, 'ganado', {
        montoFinal: montoVal,
        ...(isUsd && { tipoCambioFinal: parseFloat(tipoCambio) }),
        cotizacionPath:  selectedCotizacion!.file_path,
        ordenCompraPath: selectedOrdenCompra!.file_path,
      })
      if (result.error) {
        setError(result.error)
      } else {
        resetAndClose()
        onConfirm()
      }
    })
  }

  function resetAndClose() {
    setMonto('')
    setTipoCambio('')
    setSelectedCotizacion(null)
    setSelectedOrdenCompra(null)
    setFiles([])
    setError(null)
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) resetAndClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como Ganado</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{oppName}</span>
            {': '}confirma qué documentos corresponden a la cotización y orden de compra.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Monto final */}
          <div className="space-y-1.5">
            <Label htmlFor="ganado-monto">Monto final ({moneda}) *</Label>
            <Input
              id="ganado-monto"
              type="number"
              min={0.01}
              step="0.01"
              placeholder="0.00"
              value={monto}
              onChange={e => setMonto(e.target.value)}
              autoFocus
            />
          </div>

          {/* Tipo de cambio al cierre */}
          {isUsd && (
            <div className="space-y-1.5">
              <Label htmlFor="ganado-tipo-cambio">Tipo de cambio al cierre (USD → MXN) *</Label>
              <Input
                id="ganado-tipo-cambio"
                type="number"
                min={0.0001}
                step="0.0001"
                placeholder="0.0000"
                value={tipoCambio}
                onChange={e => setTipoCambio(e.target.value)}
              />
            </div>
          )}

          {loadingFiles ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando documentos…
            </div>
          ) : (
            <>
              <DocSlot
                label="Cotización *"
                categoria="cotizacion"
                files={files}
                selected={selectedCotizacion}
                onSelect={setSelectedCotizacion}
                onUpload={file => uploadInline(file, 'cotizacion', setSelectedCotizacion)}
              />
              <DocSlot
                label="Orden de compra *"
                categoria="orden_compra"
                files={files}
                selected={selectedOrdenCompra}
                onSelect={setSelectedOrdenCompra}
                onUpload={file => uploadInline(file, 'orden_compra', setSelectedOrdenCompra)}
              />
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={pending}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={!canConfirm || pending}>
            {pending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando…</>
            ) : 'Confirmar ganado'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DocSlotProps {
  label:     string
  categoria: OpportunityFileCategoria
  files:     OpportunityFileRow[]
  selected:  OpportunityFileRow | null
  onSelect:  (f: OpportunityFileRow | null) => void
  onUpload:  (file: File) => Promise<void>
}

function DocSlot({ label, categoria, files, selected, onSelect, onUpload }: DocSlotProps) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(newFiles: File[]) {
    const file = newFiles[0]
    if (!file) return
    setUploading(true)
    await onUpload(file)
    setUploading(false)
  }

  if (selected) {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{selected.nombre}</span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="shrink-0 text-xs underline hover:text-foreground"
          >
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  // Archivos ya subidos, con los de la categoría sugerida primero.
  const sorted = [...files].sort(
    (a, b) => Number(b.categoria === categoria) - Number(a.categoria === categoria),
  )

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {sorted.length > 0 && (
        <Select onValueChange={id => onSelect(files.find(f => f.id === id) ?? null)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un archivo ya subido…" />
          </SelectTrigger>
          <SelectContent>
            {sorted.map(f => (
              <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <FileDropzone
        multiple={false}
        compact
        uploading={uploading}
        helperText="o sube uno nuevo"
        onFilesSelected={handleUpload}
      />
    </div>
  )
}
