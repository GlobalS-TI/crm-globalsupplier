'use client'

import { useRef, useState } from 'react'
import { Upload, Loader2, CheckCircle2 } from 'lucide-react'

interface Props {
  onFilesSelected: (files: File[]) => void
  multiple?:       boolean
  accept?:         string
  disabled?:       boolean
  uploading?:      boolean
  uploadedLabel?:  string | null
  helperText?:     string
  compact?:        boolean
  className?:      string
}

export function FileDropzone({
  onFilesSelected,
  multiple = false,
  accept,
  disabled = false,
  uploading = false,
  uploadedLabel = null,
  helperText = 'PDF, imágenes, documentos',
  compact = false,
  className,
}: Props) {
  const inputRef                = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const busy = disabled || uploading

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    const list = multiple ? Array.from(files) : [files[0]]
    onFilesSelected(list)
  }

  return (
    <div className={className}>
      <div
        onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          if (!busy) handleFiles(e.dataTransfer.files)
        }}
        onClick={() => !busy && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg text-center transition-colors select-none ${
          compact ? 'p-3' : 'p-6'
        } ${
          busy       ? 'cursor-not-allowed opacity-60 border-border' :
          dragging   ? 'cursor-pointer border-primary bg-primary/5' :
          !multiple && uploadedLabel ? 'cursor-pointer border-emerald-500 bg-emerald-500/5' :
          'cursor-pointer border-border hover:border-primary/50'
        }`}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className={compact ? 'h-4 w-4 animate-spin' : 'h-5 w-5 animate-spin'} />
            <p className="text-xs">Subiendo…</p>
          </div>
        ) : !multiple && uploadedLabel ? (
          <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
            <p className="text-xs font-medium truncate max-w-full">{uploadedLabel}</p>
            <p className="text-xs text-muted-foreground">Haz clic para cambiar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
            <p className="text-xs font-medium">Arrastra {multiple ? 'archivos' : 'el archivo'} aquí o haz clic</p>
            {helperText && <p className="text-xs">{helperText}</p>}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={busy}
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>
    </div>
  )
}
