'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createItemAndReturn, addUploadedFile } from '@/app/(dashboard)/contenido/actions'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const BUSINESS_UNITS = [
  { value: 'global_supplier_mty', label: 'Global Supplier MTY' },
  { value: 'thunder_safety',       label: 'Thunder Safety Solutions' },
  { value: 'thunder_led',          label: 'Thunder LED Lights' },
  { value: 'got_fresh_breath',     label: 'Got Fresh Breath' },
  { value: 'gtx_systems',          label: 'GTX Systems' },
  { value: 'juno_promotional',     label: 'Juno Promotional' },
  { value: 'fire_spot',            label: 'Fire Spot' },
]

interface Props {
  categoryId: string
}

export function NewItemModal({ categoryId }: Props) {
  const router       = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef      = useRef<HTMLFormElement>(null)

  const [open, setOpen]   = useState(false)
  const [file, setFile]   = useState<File | null>(null)
  const [error, setError] = useState('')
  const [isPending, start] = useTransition()

  function handleClose(v: boolean) {
    if (!v) { setFile(null); setError('') }
    setOpen(v)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const form = new FormData(e.currentTarget)

    start(async () => {
      // 1. Create the item
      const result = await createItemAndReturn(form)
      if ('error' in result) { setError(result.error); return }

      const { id: itemId, businessUnit } = result

      // 2. Upload file if selected
      if (file) {
        const ext      = file.name.split('.').pop() ?? ''
        const basename = file.name.replace(`.${ext}`, '').replace(/[^a-zA-Z0-9._-]/g, '-')
        const path     = `${businessUnit}/${itemId}/${Date.now()}-${basename}.${ext}`

        const supabase = createClient()
        const { error: storageErr } = await supabase.storage
          .from('media')
          .upload(path, file, { cacheControl: '3600' })

        if (storageErr) {
          // Item was created — go to detail page, user can upload from there
          setOpen(false)
          router.push(`/contenido/${itemId}`)
          return
        }

        await addUploadedFile({
          item_id:   itemId,
          nombre:    file.name,
          file_path: path,
          mime_type: file.type || undefined,
          file_size: file.size || undefined,
        })
      }

      setOpen(false)
      setFile(null)
      router.push(`/contenido/${itemId}`)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo elemento
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo elemento</DialogTitle>
        </DialogHeader>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="category_id" value={categoryId} />

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ni_nombre">Nombre *</Label>
            <Input id="ni_nombre" name="nombre" required autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ni_unit">Marca *</Label>
            <Select name="business_unit" required>
              <SelectTrigger id="ni_unit">
                <SelectValue placeholder="Selecciona una marca" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_UNITS.map(u => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ni_desc">Descripción</Label>
            <Textarea id="ni_desc" name="descripcion" rows={2} placeholder="Opcional" />
          </div>

          <div className="space-y-1.5">
            <Label>
              Archivo{' '}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>

            {file ? (
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/30 text-sm">
                <span className="flex-1 truncate">{file.name}</span>
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-md py-5 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <Upload className="h-4 w-4" />
                Seleccionar archivo — PDF, imagen, video…
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{file ? 'Subiendo…' : 'Creando…'}</>
                : 'Crear elemento'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
