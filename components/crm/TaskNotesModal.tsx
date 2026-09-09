'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getTaskNoteMessages, addTaskNoteMessage } from '@/app/(dashboard)/actividades/task-actions'
import type { TaskNoteMessageRow } from '@/lib/repositories/interfaces/ITaskRepository'

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

interface Props {
  open:          boolean
  onOpenChange:  (v: boolean) => void
  taskId:        string
  columnId:      string
  columnNombre:  string
  taskTitulo:    string
  onMessageSent: (content: string) => void
}

export function TaskNotesModal({ open, onOpenChange, taskId, columnId, columnNombre, taskTitulo, onMessageSent }: Props) {
  const [messages, setMessages]    = useState<TaskNoteMessageRow[]>([])
  const [loading, setLoading]      = useState(false)
  const [content, setContent]      = useState('')
  const [error, setError]          = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    getTaskNoteMessages(taskId, columnId).then(result => {
      if ('error' in result) setError(result.error)
      else setMessages(result.messages)
      setLoading(false)
    })
  }, [open, taskId, columnId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend() {
    const text = content.trim()
    if (!text) return
    startTransition(async () => {
      const result = await addTaskNoteMessage(taskId, columnId, text)
      if ('error' in result) { setError(result.error); return }
      setMessages(prev => [...prev, result.message])
      setContent('')
      onMessageSent(text)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{columnNombre}</DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{taskTitulo}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2 min-h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Sin notas aún. Sé el primero en escribir.
            </p>
          ) : (
            messages.map(m => {
              const name = m.author?.full_name ?? 'Usuario'
              return (
                <div key={m.id} className="flex gap-3 items-start">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                    {initials(name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold">{name}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(m.created_at)}</span>
                    </div>
                    <div className="bg-muted/40 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm whitespace-pre-wrap break-words">
                      {m.content}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t pt-3 space-y-2">
          <div className="flex gap-2 items-end">
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={2}
              placeholder="Escribe una nota…"
              className="resize-none flex-1"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSend() }
              }}
            />
            <Button type="button" size="sm" className="h-8 w-8 p-0" onClick={handleSend} disabled={pending || !content.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">⌘ + Enter para enviar</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
