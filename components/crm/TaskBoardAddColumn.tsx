'use client'

import { useState, useTransition } from 'react'
import { Plus, X, Loader2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { Json } from '@/lib/types/database'
import type { TaskBoardColumnRow } from '@/lib/repositories/interfaces/ITaskRepository'
import type { TaskColumnType, SelectorOption } from '@/lib/validations/task'
import { addBoardColumn } from '@/app/(dashboard)/actividades/task-actions'

const TIPO_LABELS: Record<TaskColumnType, string> = {
  text:           'Texto',
  number:         'Número',
  date:           'Fecha',
  selector:       'Selección simple',
  multi_selector: 'Selección múltiple',
  person:         'Persona',
  url:            'URL',
  business_unit:  'Marca',
  archivo:        'Archivo adjunto',
  priority:       'Prioridad',
}

const SELECTOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
  '#ec4899', '#14b8a6',
]

interface Props {
  boardId:        string
  nextPosition:   number
  onColumnAdded:  (col: TaskBoardColumnRow) => void
}

export function TaskBoardAddColumn({ boardId, nextPosition, onColumnAdded }: Props) {
  const [open,    setOpen]    = useState(false)
  const [nombre,  setNombre]  = useState('')
  const [tipo,    setTipo]    = useState<TaskColumnType>('text')
  const [options, setOptions] = useState<SelectorOption[]>([])
  const [newOpt,  setNewOpt]  = useState('')
  const [pending, start]      = useTransition()

  function reset() {
    setNombre(''); setTipo('text'); setOptions([]); setNewOpt('')
  }

  function addOption() {
    const v = newOpt.trim()
    if (!v) return
    const color = SELECTOR_PALETTE[options.length % SELECTOR_PALETTE.length]
    setOptions(prev => [...prev, { value: v.toLowerCase().replace(/\s+/g, '_'), label: v, color }])
    setNewOpt('')
  }

  function removeOption(i: number) {
    setOptions(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit() {
    const name = nombre.trim()
    if (!name) return
    start(async () => {
      const needsOptions = tipo === 'selector' || tipo === 'multi_selector'
      const config = needsOptions ? { options } : {}
      const result = await addBoardColumn({ board_id: boardId, nombre: name, tipo, position: nextPosition, config })
      if ('id' in result && result.id) {
        onColumnAdded({
          id:         result.id,
          board_id:   boardId,
          nombre:     name,
          tipo,
          position:   nextPosition,
          config:     config as Json,
          created_at: new Date().toISOString(),
        })
        reset()
        setOpen(false)
      }
    })
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => { reset(); setOpen(true) }}
        className="gap-1.5 text-xs"
      >
        <Plus className="h-3.5 w-3.5" />
        Nueva columna
      </Button>

      <Dialog open={open} onOpenChange={v => { if (!v) reset(); setOpen(v) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Nueva columna</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="col-nombre">Nombre</Label>
              <input
                id="col-nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
                placeholder="Ej. Área, Fecha límite…"
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <Label htmlFor="col-tipo">Tipo</Label>
              <select
                id="col-tipo"
                value={tipo}
                onChange={e => setTipo(e.target.value as TaskColumnType)}
                className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring"
              >
                {(Object.keys(TIPO_LABELS) as TaskColumnType[]).map(t => (
                  <option key={t} value={t}>{TIPO_LABELS[t]}</option>
                ))}
              </select>
            </div>

            {/* Options (selector / multi_selector) */}
            {(tipo === 'selector' || tipo === 'multi_selector') && (
              <div className="space-y-2">
                <Label>Opciones</Label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="text-sm flex-1">{opt.label}</span>
                      <button onClick={() => removeOption(i)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newOpt}
                    onChange={e => setNewOpt(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
                    placeholder="Agregar opción…"
                    className="flex-1 px-3 py-1.5 text-sm bg-background border border-input rounded-md outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => { reset(); setOpen(false) }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={pending || !nombre.trim()}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Agregar columna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
