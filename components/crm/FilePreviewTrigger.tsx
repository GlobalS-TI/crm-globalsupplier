'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { getFileKind } from '@/lib/utils/files'

interface FilePreviewTriggerProps {
  url:        string
  name:       string
  mimeType?:  string | null
  children:   React.ReactNode
  className?: string
}

// Envuelve cualquier trigger visual (thumbnail, ícono, fila) para abrir un preview
// grande en vez de forzar target="_blank". Cuando el tipo no se puede previsualizar
// en el navegador, se degrada a un link de descarga directa (nunca nueva pestaña).
export function FilePreviewTrigger({ url, name, mimeType, children, className }: FilePreviewTriggerProps) {
  const [open, setOpen] = useState(false)
  const kind = getFileKind(mimeType, name || url)

  if (kind === 'other') {
    return (
      <a href={url} download={name} className={className}>
        {children}
      </a>
    )
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90dvh] p-0 gap-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
            <DialogTitle className="text-sm font-medium truncate pr-6">{name}</DialogTitle>
          </DialogHeader>

          <div className="px-4 pb-4 flex-1 min-h-0 overflow-y-auto flex items-center justify-center">
            {kind === 'image' && (
              <img
                src={url}
                alt={name}
                className="max-h-[60vh] sm:max-h-[75vh] max-w-full object-contain rounded-md bg-muted/30"
              />
            )}
            {kind === 'video' && (
              <video src={url} controls autoPlay className="max-h-[60vh] sm:max-h-[75vh] max-w-full rounded-md bg-black" />
            )}
            {kind === 'pdf' && (
              <iframe src={url} title={name} className="w-full h-[60vh] sm:h-[75vh] rounded-md border" />
            )}
          </div>

          <div className="flex justify-end px-4 pb-4 shrink-0">
            <a href={url} download={name}>
              <Button variant="outline" size="sm">
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Descargar
              </Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface FileRowThumbProps {
  url:          string
  name:         string
  mimeType?:    string | null
  fallbackIcon: React.ComponentType<{ className?: string }>
}

// Thumbnail cuadrado para filas de lista: imagen real si el archivo es previsualizable,
// ícono de respaldo en caso contrario. Mismo tamaño en ambos casos para no saltar el layout.
export function FileRowThumb({ url, name, mimeType, fallbackIcon: Icon }: FileRowThumbProps) {
  const kind = getFileKind(mimeType, name || url)

  if (kind === 'image') {
    return <img src={url} alt={name} className="h-9 w-9 rounded object-cover shrink-0 border" />
  }

  return (
    <div className="h-9 w-9 rounded border bg-muted/40 flex items-center justify-center shrink-0">
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  )
}
