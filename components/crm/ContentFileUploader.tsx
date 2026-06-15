'use client'

import { useRef, useState, useActionState, useEffect, useTransition } from 'react'
import { Upload, Youtube, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { addUploadedFile, addYouTubeFile } from '@/app/(dashboard)/contenido/actions'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type ActionState = { error: string } | null

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
}

function isYouTubeUrl(url: string): boolean {
  return /youtube\.com\/watch|youtu\.be\//.test(url)
}

interface Props {
  itemId:       string
  businessUnit: string
}

export function ContentFileUploader({ itemId, businessUnit }: Props) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [tab, setTab]         = useState<'file' | 'youtube'>('file')
  const [dragging, setDragging] = useState(false)
  const [uploading, startUpload] = useTransition()

  // YouTube form
  const [ytState, ytAction, ytPending] = useActionState<ActionState, FormData>(addYouTubeFile, null)
  const ytWasPending = useRef(false)
  const ytFormRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (ytWasPending.current && !ytPending) {
      if (ytState === null) {
        toast({ title: 'Video agregado correctamente' })
        ytFormRef.current?.reset()
      } else if (ytState?.error) {
        toast({ title: 'Error', description: ytState.error, variant: 'destructive' })
      }
    }
    ytWasPending.current = ytPending
  }, [ytPending, ytState, toast])

  async function uploadFile(file: File) {
    const ext      = file.name.split('.').pop() ?? ''
    const basename = sanitizeFilename(file.name.replace(`.${ext}`, ''))
    const path     = `${businessUnit}/${itemId}/${Date.now()}-${basename}.${ext}`

    startUpload(async () => {
      const supabase = createClient()
      const { error: storageError } = await supabase.storage
        .from('media')
        .upload(path, file, { cacheControl: '3600', upsert: false })

      if (storageError) {
        toast({ title: 'Error al subir', description: storageError.message, variant: 'destructive' })
        return
      }

      const result = await addUploadedFile({
        item_id:   itemId,
        nombre:    file.name,
        file_path: path,
        mime_type: file.type || undefined,
        file_size: file.size ?? undefined,
      })

      if (result?.error) {
        toast({ title: 'Error al guardar', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Archivo subido correctamente' })
      }
    })
  }

  function handleFiles(files: FileList | null) {
    if (!files?.length) return
    Array.from(files).forEach(uploadFile)
  }

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-md w-fit">
        <button
          type="button"
          onClick={() => setTab('file')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
            tab === 'file' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="h-3.5 w-3.5" />
          Subir archivo
        </button>
        <button
          type="button"
          onClick={() => setTab('youtube')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded transition-colors ${
            tab === 'youtube' ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Youtube className="h-3.5 w-3.5" />
          YouTube
        </button>
      </div>

      {tab === 'file' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">Subiendo…</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Upload className="h-6 w-6" />
              <p className="text-sm font-medium">Arrastra archivos aquí o haz clic</p>
              <p className="text-xs">PDF, imágenes, video · Máximo 200 MB</p>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={e => handleFiles(e.target.files)}
          />
        </div>
      )}

      {tab === 'youtube' && (
        <form ref={ytFormRef} action={ytAction} className="space-y-3">
          <input type="hidden" name="item_id" value={itemId} />

          {ytState?.error && (
            <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">{ytState.error}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="yt_url" className="text-xs">URL de YouTube</Label>
            <Input
              id="yt_url"
              name="url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="yt_nombre" className="text-xs">Nombre del video</Label>
            <Input id="yt_nombre" name="nombre" required placeholder="Ej: Demo ATRIUM 2025" />
          </div>

          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={ytPending}>
              {ytPending ? 'Agregando…' : 'Agregar video'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
