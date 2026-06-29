'use client'

import { useRef, useState, useTransition } from 'react'
import { Upload, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
}

interface Props {
  projectId:  string
  onUploaded: (url: string, label: string) => void
  label?:     string
  className?: string
}

export function ProjectFileDropzone({ projectId, onUploaded, label, className }: Props) {
  const inputRef                   = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]    = useState(false)
  const [uploaded, setUploaded]    = useState<string | null>(null)
  const [error, setError]          = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function uploadFile(file: File) {
    setError(null)
    setUploaded(null)
    const ext      = file.name.split('.').pop() ?? ''
    const basename = sanitize(file.name.replace(`.${ext}`, ''))
    const path     = `projects/${projectId}/${Date.now()}-${basename}.${ext}`

    startTransition(async () => {
      const supabase = createClient()
      const { error: storageError } = await supabase.storage
        .from('media')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (storageError) {
        setError(storageError.message)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      setUploaded(file.name)
      onUploaded(publicUrl, file.name)
    })
  }

  function handleFiles(files: FileList | null) {
    if (files?.[0]) uploadFile(files[0])
  }

  return (
    <div className={className}>
      {label && (
        <p className="text-xs font-medium text-muted-foreground mb-1.5">{label}</p>
      )}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => !pending && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors select-none ${
          dragging   ? 'border-primary bg-primary/5' :
          uploaded   ? 'border-emerald-500 bg-emerald-500/5' :
          'border-border hover:border-primary/50'
        }`}
      >
        {pending ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-xs">Subiendo…</p>
          </div>
        ) : uploaded ? (
          <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-xs font-medium truncate max-w-full">{uploaded}</p>
            <p className="text-xs text-muted-foreground">Haz clic para cambiar</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-5 w-5" />
            <p className="text-xs font-medium">Arrastra el archivo aquí o haz clic</p>
            <p className="text-xs">PDF, imágenes, documentos</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
