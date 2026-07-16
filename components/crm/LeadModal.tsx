'use client'

import { useActionState, useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { Plus, Pencil, Upload, X, Loader2, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  createLeadAndReturn, setLeadRequirementFile, updateLead,
} from '@/app/(dashboard)/leads/actions'
import type { LeadWithRelations } from '@/lib/repositories/interfaces/ILeadRepository'

type ActionState = { error: string } | null

export type AssignableUser = { id: string; full_name: string }

const ACCEPTED = '.png,.jpg,.jpeg,.pdf,.webp'

// ── Create ────────────────────────────────────────────────────────

interface CreateProps {
  sectionId:       string
  assignableUsers: AssignableUser[]
}

export function NewLeadButton({ sectionId, assignableUsers }: CreateProps) {
  const [open, setOpen]         = useState(false)
  const [file, setFile]         = useState<File | null>(null)
  const [error, setError]       = useState('')
  const [isPending, start]      = useTransition()
  const fileInputRef            = useRef<HTMLInputElement>(null)

  function handleClose(v: boolean) {
    if (!v) { setFile(null); setError('') }
    setOpen(v)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const form = new FormData(e.currentTarget)

    start(async () => {
      const result = await createLeadAndReturn(form)
      if ('error' in result) { setError(result.error); return }

      if (file) {
        const ext      = file.name.split('.').pop() ?? ''
        const basename = file.name.replace(`.${ext}`, '').replace(/[^a-zA-Z0-9._-]/g, '-')
        const path     = `leads/${result.id}/${Date.now()}-${basename}.${ext}`
        const supabase = createClient()
        const { error: storageErr } = await supabase.storage
          .from('media')
          .upload(path, file, { cacheControl: '3600' })
        if (!storageErr) {
          await setLeadRequirementFile(result.id, path)
        }
      }

      handleClose(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Nuevo lead
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <input type="hidden" name="section_id" value={sectionId} />

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>
          )}

          <SharedFields assignableUsers={assignableUsers} />

          {/* Requirement file */}
          <div className="space-y-1.5">
            <Label>
              Archivo de requerimiento{' '}
              <span className="text-muted-foreground font-normal text-xs">(imagen o PDF, opcional)</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted/30 text-sm">
                <span className="flex-1 truncate text-xs">{file.name}</span>
                <button
                  type="button"
                  onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-md py-3 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                PNG, JPG, PDF…
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{file ? 'Subiendo…' : 'Creando…'}</>
                : 'Crear lead'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit ──────────────────────────────────────────────────────────

interface EditProps {
  lead:            LeadWithRelations
  assignableUsers: AssignableUser[]
  requirementUrl?: string | null
}

export function EditLeadButton({ lead, assignableUsers, requirementUrl }: EditProps) {
  const [open, setOpen] = useState(false)
  const bound = updateLead.bind(null, lead.id)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(bound, null)
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending && state === null) setOpen(false)
    wasPending.current = pending
  }, [pending, state])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lead</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4 pt-1">
          {state?.error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{state.error}</p>
          )}

          <SharedFields assignableUsers={assignableUsers} defaultValues={lead} />

          {/* Show existing requirement file if any */}
          {(requirementUrl || lead.requirements_file_path) && (
            <div className="space-y-1.5">
              <Label>Archivo adjunto</Label>
              <a
                href={requirementUrl ?? '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 border rounded-md text-xs text-primary hover:bg-accent transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lead.requirements_file_path?.split('/').pop()}</span>
              </a>
              <p className="text-xs text-muted-foreground">
                Para reemplazar el archivo, usa el botón de nuevo lead o sube desde el detalle.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="submit" disabled={pending}>
              {pending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Shared fields (used by both forms) ───────────────────────────

interface SharedProps {
  assignableUsers: AssignableUser[]
  defaultValues?:  LeadWithRelations
}

function SharedFields({ assignableUsers, defaultValues }: SharedProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="lf_nombre">Nombre *</Label>
        <Input
          id="lf_nombre"
          name="nombre"
          required
          autoFocus
          defaultValue={defaultValues?.nombre}
          placeholder="Nombre del contacto"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lf_empresa">Empresa</Label>
        <Input
          id="lf_empresa"
          name="empresa"
          defaultValue={defaultValues?.empresa ?? ''}
          placeholder="Nombre de la empresa"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="lf_tel">Teléfono</Label>
        <Input
          id="lf_tel"
          name="telefono"
          type="tel"
          defaultValue={defaultValues?.telefono ?? ''}
          placeholder="+52 81 0000 0000"
        />
      </div>

      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="lf_email">Correo electrónico</Label>
        <Input
          id="lf_email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ''}
          placeholder="correo@empresa.com"
        />
      </div>

      {/* Responsable — siempre direccion_comercial, solo lectura */}
      {defaultValues?.responsable && (
        <div className="space-y-1.5 col-span-2">
          <Label>Responsable</Label>
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
            {defaultValues.responsable.full_name}
            <span className="ml-auto text-xs">Dirección Comercial</span>
          </div>
        </div>
      )}

      {/* Vendedor — asignable por director. Una vez convertido a oportunidad, la reasignación
          ya se hace desde /oportunidades, no desde aquí. */}
      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="lf_vendedor">Vendedor asignado</Label>
        {defaultValues?.converted_opportunity_id ? (
          <Link
            href={`/oportunidades/${defaultValues.converted_opportunity_id}` as Route}
            className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {defaultValues.vendedor?.full_name ?? 'Sin asignar'}
            <span className="ml-auto text-xs text-primary">Ver oportunidad →</span>
          </Link>
        ) : (
          <Select name="vendedor_id" defaultValue={defaultValues?.vendedor_id ?? '__none__'}>
            <SelectTrigger id="lf_vendedor">
              <SelectValue placeholder="Sin asignar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin asignar</SelectItem>
              {assignableUsers.map(u => (
                <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-1.5 col-span-2">
        <Label htmlFor="lf_req">Requerimientos</Label>
        <Textarea
          id="lf_req"
          name="requerimientos"
          rows={2}
          defaultValue={defaultValues?.requerimientos ?? ''}
          placeholder="Descripción de lo que necesita el cliente…"
        />
      </div>
    </div>
  )
}
