'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import { ExternalLink, Trash2, FileText, ClipboardCheck, Receipt, Paperclip } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FileDropzone } from '@/components/crm/FileDropzone'
import { createClient } from '@/lib/supabase/client'
import { addOpportunityFile } from '@/app/(dashboard)/oportunidades/actions'
import type { OpportunityFileRow } from '@/lib/repositories/interfaces/IOpportunityFileRepository'
import type { OpportunityFileCategoria } from '@/lib/validations/opportunityFile'

const CATEGORIA_LABELS: Record<OpportunityFileCategoria, string> = {
  cotizacion:    'Cotización',
  orden_compra:  'Orden de compra',
  factura:       'Factura',
  otro:          'Otro',
}

const CATEGORIA_ICON: Record<OpportunityFileCategoria, React.ComponentType<{ className?: string }>> = {
  cotizacion:   FileText,
  orden_compra: ClipboardCheck,
  factura:      Receipt,
  otro:         Paperclip,
}

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-')
}

interface Props {
  opportunityId: string
  files:         OpportunityFileRow[]
  signedUrls:    Record<string, string>
  deleteAction:  (fileId: string) => Promise<{ error?: string }>
}

export function OpportunityFilesPanel({ opportunityId, files, signedUrls, deleteAction }: Props) {
  const router = useRouter()
  const [uploading, startUpload] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function handleFiles(selected: File[]) {
    setError('')
    startUpload(async () => {
      for (const file of selected) {
        const ext      = file.name.split('.').pop() ?? ''
        const basename = sanitize(file.name.replace(`.${ext}`, ''))
        const path     = `opportunity-docs/${opportunityId}/${Date.now()}-${basename}.${ext}`

        const supabase = createClient()
        const { error: storageErr } = await supabase.storage
          .from('media')
          .upload(path, file, { cacheControl: '3600', upsert: false })

        if (storageErr) { setError(storageErr.message); continue }

        const result = await addOpportunityFile({
          opportunity_id: opportunityId,
          nombre:         file.name,
          file_path:      path,
          mime_type:      file.type || undefined,
          file_size:      file.size || undefined,
        })
        if (result.error) setError(result.error)
      }
      router.refresh()
    })
  }

  function handleDelete(fileId: string) {
    setError('')
    setDeletingId(fileId)
    startUpload(async () => {
      const result = await deleteAction(fileId)
      if (result.error) setError(result.error)
      setDeletingId(null)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">Sin archivos adjuntos.</p>
      ) : (
        <div className="rounded-md border divide-y">
          {files.map(file => {
            const Icon = CATEGORIA_ICON[file.categoria]
            const url  = signedUrls[file.id]
            return (
              <div key={file.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="flex-1 min-w-0 text-sm font-medium truncate">{file.nombre}</p>
                <Badge variant="outline" className="text-xs shrink-0">
                  {CATEGORIA_LABELS[file.categoria]}
                </Badge>
                {url && (
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button
                  onClick={() => handleDelete(file.id)}
                  disabled={deletingId === file.id}
                  className="text-muted-foreground hover:text-destructive transition-colors shrink-0 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div className="space-y-2 pt-2 border-t">
        <p className="text-sm font-medium pt-2">Subir archivo</p>
        <FileDropzone
          multiple
          uploading={uploading}
          helperText="PDF, imágenes, documentos"
          onFilesSelected={handleFiles}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  )
}
