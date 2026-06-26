'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Send, Paperclip, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ProjectFileDropzone } from '@/components/crm/ProjectFileDropzone'
import type { ActionState } from '@/app/(dashboard)/proyectos/actions'
import type { ProjectUpdateRow } from '@/lib/repositories/interfaces/IProjectRepository'

interface Props {
  projectId: string
  updates:   ProjectUpdateRow[]
  action:    (prev: ActionState, form: FormData) => Promise<ActionState>
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export function ProjectUpdatesFeed({ projectId, updates, action }: Props) {
  const bottomRef                  = useRef<HTMLDivElement>(null)
  const formRef                    = useRef<HTMLFormElement>(null)
  const [fileUrl, setFileUrl]      = useState('')
  const [fileLabel, setFileLabel]  = useState('')
  const [showDrop, setShowDrop]    = useState(false)

  const [state, dispatch, pending] = useActionState(
    async (prev: ActionState, form: FormData) => {
      const result = await action(prev, form)
      if (!result) {
        formRef.current?.reset()
        setFileUrl('')
        setFileLabel('')
        setShowDrop(false)
      }
      return result
    },
    null,
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [updates.length])

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-260px)] min-h-[400px]">
      {/* Feed */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Sin actualizaciones aún. Sé el primero en publicar.
          </p>
        ) : (
          updates.map(u => {
            const name = u.author?.full_name ?? 'Usuario'
            return (
              <div key={u.id} className="flex gap-3 items-start">
                {/* Avatar */}
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                  {initials(name)}
                </div>
                {/* Bubble */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="text-xs text-muted-foreground">{formatTime(u.created_at)}</span>
                  </div>
                  <div className="bg-muted/40 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap break-words">
                    {u.content}
                  </div>
                  {u.file_url && (
                    <a
                      href={u.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Paperclip className="h-3 w-3" />
                      {u.file_label ?? 'Archivo adjunto'}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <div className="border-t pt-4 space-y-3">
        <form ref={formRef} action={dispatch} className="space-y-2">
          {fileUrl && (
            <>
              <input type="hidden" name="file_url"   value={fileUrl} />
              <input type="hidden" name="file_label" value={fileLabel} />
            </>
          )}

          <div className="flex gap-2 items-end">
            <Textarea
              name="content"
              required
              rows={2}
              placeholder="Escribe una actualización…"
              className="resize-none flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.currentTarget.form?.requestSubmit()
                }
              }}
            />
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setShowDrop(v => !v)}
                title="Adjuntar archivo"
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="submit" size="sm" className="h-8 w-8 p-0" disabled={pending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {state?.error && (
            <p className="text-xs text-destructive">{state.error}</p>
          )}
        </form>

        {showDrop && (
          <div className="relative">
            <button
              type="button"
              onClick={() => { setShowDrop(false); setFileUrl(''); setFileLabel('') }}
              className="absolute top-1 right-1 z-10 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <ProjectFileDropzone
              projectId={projectId}
              onUploaded={(url, label) => { setFileUrl(url); setFileLabel(label) }}
            />
          </div>
        )}

        {fileUrl && !showDrop && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <Paperclip className="h-3 w-3" />
            {fileLabel}
            <button type="button" onClick={() => { setFileUrl(''); setFileLabel('') }}>
              <X className="h-3 w-3 ml-1 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">⌘ + Enter para enviar</p>
      </div>
    </div>
  )
}
