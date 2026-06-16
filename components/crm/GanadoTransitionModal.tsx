'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Loader2, Upload, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { kanbanMoveToStage } from '@/app/(dashboard)/oportunidades/actions'

type DocState = { path: string; name: string } | null

interface Props {
  open:     boolean
  oppId:    string
  oppName:  string
  onConfirm: () => void
  onCancel:  () => void
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
}

export function GanadoTransitionModal({ open, oppId, oppName, onConfirm, onCancel }: Props) {
  const [monto,      setMonto]      = useState('')
  const [cotizacion, setCotizacion] = useState<DocState>(null)
  const [ordenCompra, setOrdenCompra] = useState<DocState>(null)
  const [uploadingCot, setUploadingCot] = useState(false)
  const [uploadingOC,  setUploadingOC]  = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const canConfirm =
    monto && parseFloat(monto) > 0 && cotizacion && ordenCompra && !uploadingCot && !uploadingOC

  async function uploadDoc(
    file: File,
    tipo: 'cotizacion' | 'orden-compra',
    setUploading: (v: boolean) => void,
    setDoc: (d: DocState) => void,
  ) {
    setUploading(true)
    setError(null)
    const ext  = file.name.split('.').pop() ?? 'pdf'
    const base = sanitize(file.name.replace(`.${ext}`, ''))
    const path = `opportunity-docs/${oppId}/${tipo}-${Date.now()}-${base}.${ext}`

    const supabase = createClient()
    const { error: storageErr } = await supabase.storage
      .from('media')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    setUploading(false)
    if (storageErr) {
      setError(`Error al subir archivo: ${storageErr.message}`)
      return
    }
    setDoc({ path, name: file.name })
  }

  function handleFileInput(
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: 'cotizacion' | 'orden-compra',
    setUploading: (v: boolean) => void,
    setDoc: (d: DocState) => void,
  ) {
    const file = e.target.files?.[0]
    if (!file) return
    uploadDoc(file, tipo, setUploading, setDoc)
    e.target.value = ''
  }

  function handleConfirm() {
    if (!canConfirm) return
    const montoVal = parseFloat(monto)
    startTransition(async () => {
      const result = await kanbanMoveToStage(
        oppId,
        'ganado',
        montoVal,
        cotizacion!.path,
        ordenCompra!.path,
      )
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
    setCotizacion(null)
    setOrdenCompra(null)
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
            {' '}— Sube cotización y orden de compra para confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Monto final */}
          <div className="space-y-1.5">
            <Label htmlFor="ganado-monto">Monto final (MXN) *</Label>
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

          {/* Cotización */}
          <DocUploadField
            label="Cotización *"
            doc={cotizacion}
            uploading={uploadingCot}
            onClear={() => setCotizacion(null)}
            onFileChange={e => handleFileInput(e, 'cotizacion', setUploadingCot, setCotizacion)}
          />

          {/* Orden de compra */}
          <DocUploadField
            label="Orden de compra *"
            doc={ordenCompra}
            uploading={uploadingOC}
            onClear={() => setOrdenCompra(null)}
            onFileChange={e => handleFileInput(e, 'orden-compra', setUploadingOC, setOrdenCompra)}
          />

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

interface DocFieldProps {
  label:        string
  doc:          DocState
  uploading:    boolean
  onClear:      () => void
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

function DocUploadField({ label, doc, uploading, onClear, onFileChange }: DocFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {doc ? (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="flex-1 truncate">{doc.name}</span>
          <button type="button" onClick={onClear} className="shrink-0 hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/60">
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
          ) : (
            <Upload className="h-4 w-4 shrink-0" />
          )}
          {uploading ? 'Subiendo…' : 'Haz clic para seleccionar archivo'}
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.docx"
            disabled={uploading}
            onChange={onFileChange}
          />
        </label>
      )}
    </div>
  )
}
