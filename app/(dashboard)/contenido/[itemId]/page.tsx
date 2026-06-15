import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft, Download, FileText, FileVideo, Image as ImageIcon, Link2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ContentItemRepository, ContentFileRepository } from '@/lib/repositories/supabase/ContentRepository'
import { ContentItemForm } from '@/components/crm/ContentItemForm'
import { ContentFileUploader } from '@/components/crm/ContentFileUploader'
import { DeleteButton } from '@/components/crm/DeleteButton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { updateItem, deleteItem, removeFile } from '../actions'
import type { ContentFileRow } from '@/lib/repositories/interfaces/IContentRepository'

export const dynamic = 'force-dynamic'

const BUSINESS_UNIT_LABELS: Record<string, string> = {
  global_supplier_mty: 'Global Supplier MTY',
  thunder_safety:       'Thunder Safety Solutions',
  thunder_led:          'Thunder LED Lights',
  got_fresh_breath:     'Got Fresh Breath',
  gtx_systems:          'GTX Systems',
  juno_promotional:     'Juno Promotional',
  fire_spot:            'Fire Spot',
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getYouTubeEmbedUrl(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`
  const shortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`
  return null
}

function fileMimeIcon(mime: string | null) {
  if (!mime) return FileText
  if (mime.startsWith('image/')) return ImageIcon
  if (mime.startsWith('video/')) return FileVideo
  return FileText
}

interface FileCardProps {
  file:              ContentFileRow
  signedUrl?:        string
  isContentManager:  boolean
  itemId:            string
}

function FileCard({ file, signedUrl, isContentManager, itemId }: FileCardProps) {
  const isImage   = file.mime_type?.startsWith('image/')
  const isVideo   = file.mime_type?.startsWith('video/')
  const isYoutube = file.tipo === 'youtube_url'
  const embedUrl  = isYoutube && file.url ? getYouTubeEmbedUrl(file.url) : null
  const Icon      = fileMimeIcon(file.mime_type)

  return (
    <div className="border rounded-lg overflow-hidden flex flex-col">
      <div className="bg-muted/40 flex items-center justify-center min-h-[180px]">
        {isImage && signedUrl ? (
          <img src={signedUrl} alt={file.nombre} className="max-h-48 max-w-full object-contain" />
        ) : isVideo && signedUrl ? (
          <video controls className="max-h-48 max-w-full" preload="metadata">
            <source src={signedUrl} type={file.mime_type ?? undefined} />
          </video>
        ) : isYoutube && embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full aspect-video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Icon className="h-12 w-12 text-muted-foreground opacity-40" />
        )}
      </div>

      <div className="px-3 py-2.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{file.nombre}</p>
            {file.file_size && (
              <p className="text-xs text-muted-foreground">{formatBytes(file.file_size)}</p>
            )}
          </div>
          {isYoutube && file.url ? (
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <Link2 className="h-3.5 w-3.5" />
              </Button>
            </a>
          ) : signedUrl ? (
            <a href={signedUrl} download={file.nombre}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <Download className="h-3.5 w-3.5" />
              </Button>
            </a>
          ) : null}
        </div>

        {isContentManager && (
          <DeleteButton
            action={removeFile.bind(null, file.id, itemId)}
            label="Eliminar"
            confirmMessage={`¿Eliminar "${file.nombre}"?`}
          />
        )}
      </div>
    </div>
  )
}

interface PageProps {
  params: Promise<{ itemId: string }>
}

export default async function ContentItemPage({ params }: PageProps) {
  const { itemId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isContentManager = ['marketing', 'director_general'].includes(profile?.role ?? '')

  const fileRepo = new ContentFileRepository()
  const [item, files] = await Promise.all([
    new ContentItemRepository().findById(itemId),
    fileRepo.listByItem(itemId),
  ])

  if (!item) notFound()

  const signedUrls: Record<string, string> = {}
  await Promise.all(
    files
      .filter(f => f.tipo === 'upload' && f.file_path)
      .map(async f => {
        try {
          signedUrls[f.id] = await fileRepo.getSignedUrl(f.file_path!, 3600)
        } catch {
          // Skip if signing fails — card renders without preview
        }
      })
  )

  const updateAction = updateItem.bind(null, itemId)
  const deleteAction = deleteItem.bind(null, itemId, item.category_id)
  const backHref = `/contenido?cat=${item.category_id}` as Route

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {item.category.nombre}
        </Link>
        {isContentManager && (
          <DeleteButton
            action={deleteAction}
            label="Eliminar elemento"
            confirmMessage={`¿Eliminar "${item.nombre}"? Se eliminarán todos los archivos adjuntos.`}
          />
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{item.nombre}</h1>
        <Badge variant="outline">{BUSINESS_UNIT_LABELS[item.business_unit] ?? item.business_unit}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Files — main area */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold">Archivos ({files.length})</h2>

          {isContentManager && (
            <ContentFileUploader itemId={itemId} businessUnit={item.business_unit} />
          )}

          {files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm border rounded-lg">
              Sin archivos adjuntos.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  signedUrl={signedUrls[file.id]}
                  isContentManager={isContentManager}
                  itemId={itemId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Edit form — sidebar */}
        {isContentManager && (
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Editar elemento</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <ContentItemForm
                  action={updateAction}
                  defaultValues={item}
                  submitLabel="Guardar cambios"
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
