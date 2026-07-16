'use client'

import { useState, useCallback, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, ExternalLink, Plus, Check, ChevronDown, Paperclip, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { createClient } from '@/lib/supabase/client'
import type { TaskBoardColumnRow } from '@/lib/repositories/interfaces/ITaskRepository'
import type { SelectorOption, ColumnConfig } from '@/lib/validations/task'
import { updateColumnConfig } from '@/app/(dashboard)/actividades/task-actions'

type User = { id: string; full_name: string; email: string }

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const BU_LABELS: Record<string, string> = {
  global_supplier_mty: 'GS',
  thunder_safety:      'TSS',
  thunder_led:         'TLL',
  got_fresh_breath:    'GFB',
  gtx_systems:         'GTX',
  juno_promotional:    'Juno',
  fire_spot:           'TFS',
}

const BU_COLORS: Record<string, string> = {
  global_supplier_mty: '#9ca3af', // gris claro
  thunder_safety:      '#facc15', // amarillo pollo
  thunder_led:         '#ca8a04', // amarillo
  got_fresh_breath:    '#38bdf8', // azul celeste
  gtx_systems:         '#1d4ed8', // azul rey
  juno_promotional:    '#6b7280', // gris ratón
  fire_spot:           '#f97316', // naranja
}

const ALL_BU = Object.keys(BU_LABELS)

// Color palette for selector options — user picks from these
const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
  '#6b7280', '#78716c', '#0f766e', '#1d4ed8',
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function parseConfig(config: unknown): ColumnConfig {
  if (typeof config === 'object' && config !== null) return config as ColumnConfig
  return {}
}

// ----------------------------------------------------------------
// Priority constants
// ----------------------------------------------------------------
const PRIORITY_OPTIONS = [
  { value: 'urgente', label: 'Urgente', color: '#ef4444' },
  { value: 'alta',    label: 'Alta',    color: '#f97316' },
  { value: 'media',   label: 'Media',   color: '#eab308' },
  { value: 'baja',    label: 'Baja',    color: '#6b7280' },
]

// ----------------------------------------------------------------
// Shared dropdown content styles (applied inside PopoverContent)
// ----------------------------------------------------------------
const dropdownContent = 'p-0 w-52 shadow-lg'

// ----------------------------------------------------------------
// Display renderers
// ----------------------------------------------------------------
function DisplayValue({ col, value, users }: { col: TaskBoardColumnRow; value: string | null; users: User[] }) {
  if (!value) return <span className="text-muted-foreground/30 text-xs select-none">—</span>

  const cfg = parseConfig(col.config)

  if (col.tipo === 'selector') {
    const opt = (cfg.options ?? []).find(o => o.value === value)
    if (!opt) return <span className="text-xs text-muted-foreground">{value}</span>
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium text-white truncate max-w-[130px]"
        style={{ backgroundColor: opt.color ?? '#6b7280' }}
      >
        {opt.label}
      </span>
    )
  }

  if (col.tipo === 'business_unit') {
    let vals: string[] = []
    try { vals = JSON.parse(value) } catch { vals = [value] }
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {vals.slice(0, 3).map(v => (
          <span key={v} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: BU_COLORS[v] ?? '#6b7280' }}>
            {BU_LABELS[v] ?? v}
          </span>
        ))}
        {vals.length > 3 && <span className="text-[10px] text-muted-foreground">+{vals.length - 3}</span>}
      </div>
    )
  }

  if (col.tipo === 'person') {
    const user = users.find(u => u.id === value)
    if (!user) return <span className="text-xs text-muted-foreground">—</span>
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
          {initials(user.full_name)}
        </span>
        <span className="text-xs truncate">{user.full_name.split(' ')[0]}</span>
      </div>
    )
  }

  if (col.tipo === 'date') {
    const d = parseISO(value)
    return (
      <span className="text-xs flex items-center gap-1 text-foreground">
        <CalendarIcon className="h-3 w-3 text-muted-foreground shrink-0" />
        {format(d, 'd MMM', { locale: es })}
      </span>
    )
  }

  if (col.tipo === 'url') {
    return (
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[140px]"
      >
        <ExternalLink className="h-3 w-3 shrink-0" />
        <span className="truncate">{value.replace(/^https?:\/\//, '')}</span>
      </a>
    )
  }

  if (col.tipo === 'priority') {
    const opt = PRIORITY_OPTIONS.find(o => o.value === value)
    if (!opt) return <span className="text-xs text-muted-foreground">{value}</span>
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: opt.color }}>
        {opt.label}
      </span>
    )
  }

  if (col.tipo === 'multi_selector') {
    let vals: string[] = []
    try { vals = JSON.parse(value) } catch { vals = [value] }
    const options = (parseConfig(col.config).options ?? [])
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {vals.slice(0, 2).map(v => {
          const opt = options.find(o => o.value === v)
          return opt ? (
            <span key={v} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: opt.color ?? '#6b7280' }}>
              {opt.label}
            </span>
          ) : null
        })}
        {vals.length > 2 && <span className="text-[10px] text-muted-foreground">+{vals.length - 2}</span>}
      </div>
    )
  }

  if (col.tipo === 'archivo') {
    let file: { url: string; name: string } | null = null
    try { file = JSON.parse(value) } catch { /* invalid */ }
    if (!file?.url) return <span className="text-xs text-muted-foreground">{value}</span>
    return (
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        onClick={e => e.stopPropagation()}
        className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[140px]"
      >
        <Paperclip className="h-3 w-3 shrink-0" />
        <span className="truncate">{file.name}</span>
      </a>
    )
  }

  if (col.tipo === 'number') {
    return <span className="text-xs tabular-nums">{Number(value).toLocaleString('es-MX')}</span>
  }

  return <span className="text-xs truncate max-w-[140px] block">{value}</span>
}

// ----------------------------------------------------------------
// Color picker strip
// ----------------------------------------------------------------
function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 px-3 py-2">
      {COLOR_PALETTE.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={cn(
            'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
            value === c ? 'border-foreground scale-110' : 'border-transparent',
          )}
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  )
}

// ----------------------------------------------------------------
// Selector popover
// ----------------------------------------------------------------
function SelectorCell({ column, value, options, onChange, onOptionsUpdate }: {
  column:          TaskBoardColumnRow
  value:           string | null
  options:         SelectorOption[]
  onChange:        (v: string | null) => void
  onOptionsUpdate: (opts: SelectorOption[]) => void
}) {
  const [open,      setOpen]      = useState(false)
  const [newLabel,  setNewLabel]  = useState('')
  const [newColor,  setNewColor]  = useState(COLOR_PALETTE[0])
  const [adding,    setAdding]    = useState(false)
  const [saving,    setSaving]    = useState(false)

  async function addOption() {
    const label = newLabel.trim()
    if (!label) return
    setSaving(true)
    const opt: SelectorOption = { value: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label, color: newColor }
    const updated = [...options, opt]
    await updateColumnConfig(column.id, { options: updated })
    onOptionsUpdate(updated)
    setNewLabel(''); setAdding(false); setSaving(false)
    // Auto pick next color
    setNewColor(COLOR_PALETTE[(options.length + 1) % COLOR_PALETTE.length])
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full min-h-[32px] flex items-center px-2 rounded hover:bg-muted/30 transition-colors gap-1 group">
          {value ? (
            (() => {
              const opt = options.find(o => o.value === value)
              return opt ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: opt.color ?? '#6b7280' }}>
                  {opt.label}
                </span>
              ) : <span className="text-muted-foreground/30 text-xs">—</span>
            })()
          ) : (
            <span className="text-muted-foreground/30 text-xs group-hover:text-muted-foreground/60 transition-colors">—</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={dropdownContent} align="start">
        <div className="py-1">
          {/* Clear */}
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            onClick={() => { onChange(null); setOpen(false) }}
          >
            — Sin valor
          </button>

          {/* Existing options */}
          {options.map(opt => (
            <button
              key={opt.value}
              className="w-full text-left px-3 py-1.5 hover:bg-muted/50 transition-colors flex items-center gap-2"
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: opt.color ?? '#6b7280' }} />
              <span className="text-xs flex-1">{opt.label}</span>
              {value === opt.value && <Check className="h-3 w-3 text-primary shrink-0" />}
            </button>
          ))}

          {/* Add option */}
          <div className="border-t border-border/40 mt-1 pt-1">
            {adding ? (
              <div className="px-3 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: newColor }} />
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addOption(); if (e.key === 'Escape') setAdding(false) }}
                    placeholder="Nombre de la opción…"
                    disabled={saving}
                    className="flex-1 text-xs bg-transparent outline-none border-b border-muted-foreground/40 pb-0.5"
                  />
                </div>
                <ColorPicker value={newColor} onChange={setNewColor} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                  <button onClick={addOption} disabled={saving || !newLabel.trim()} className="text-xs text-primary hover:text-primary/80 disabled:opacity-40">Guardar</button>
                </div>
              </div>
            ) : (
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors flex items-center gap-1.5"
                onClick={() => setAdding(true)}
              >
                <Plus className="h-3 w-3" /> Agregar opción
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ----------------------------------------------------------------
// Business unit popover
// ----------------------------------------------------------------
function BusinessUnitCell({ value, onChange, allowedBusinessUnits }: {
  value:                string | null
  onChange:             (v: string | null) => void
  allowedBusinessUnits: string[]
}) {
  const [open, setOpen] = useState(false)
  let selected: string[] = []
  try { selected = value ? JSON.parse(value) : [] } catch { selected = [] }

  // Solo se pueden marcar las marcas asignadas al usuario actual — las ya
  // seleccionadas se siguen mostrando aunque ya no estén entre sus asignadas.
  const selectableBU = ALL_BU.filter(bu => allowedBusinessUnits.includes(bu))

  function toggle(bu: string) {
    const next = selected.includes(bu) ? selected.filter(v => v !== bu) : [...selected, bu]
    onChange(next.length ? JSON.stringify(next) : null)
  }

  const display = selected.length === 0
    ? <span className="text-muted-foreground/30 text-xs group-hover:text-muted-foreground/60 transition-colors">—</span>
    : (
      <div className="flex items-center gap-1 flex-wrap">
        {selected.slice(0, 3).map(v => (
          <span key={v} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white" style={{ backgroundColor: BU_COLORS[v] ?? '#6b7280' }}>
            {BU_LABELS[v] ?? v}
          </span>
        ))}
        {selected.length > 3 && <span className="text-[10px] text-muted-foreground">+{selected.length - 3}</span>}
      </div>
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full min-h-[32px] flex items-center px-2 rounded hover:bg-muted/30 transition-colors gap-1 group">
          {display}
          <ChevronDown className="h-3 w-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(dropdownContent, 'w-56')} align="start">
        <div className="py-1">
          {selectableBU.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No tienes marcas asignadas.</p>
          )}
          {selectableBU.map(bu => (
            <button
              key={bu}
              className="w-full text-left px-3 py-1.5 hover:bg-muted/50 transition-colors flex items-center gap-2"
              onClick={() => toggle(bu)}
            >
              <span className={cn('w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors', selected.includes(bu) ? 'bg-primary border-primary' : 'border-border')}>
                {selected.includes(bu) && <span className="text-[8px] text-white font-bold leading-none">✓</span>}
              </span>
              <span className="text-[10px] font-bold text-white px-1 py-0.5 rounded shrink-0" style={{ backgroundColor: BU_COLORS[bu] }}>
                {BU_LABELS[bu]}
              </span>
              <span className="text-xs text-muted-foreground truncate">{bu.replace(/_/g, ' ')}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ----------------------------------------------------------------
// Person popover
// ----------------------------------------------------------------
function PersonCell({ users, value, onChange }: { users: User[]; value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const user = users.find(u => u.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full min-h-[32px] flex items-center px-2 rounded hover:bg-muted/30 transition-colors gap-1.5 group">
          {user ? (
            <>
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
                {initials(user.full_name)}
              </span>
              <span className="text-xs truncate">{user.full_name.split(' ')[0]}</span>
            </>
          ) : (
            <span className="text-muted-foreground/30 text-xs group-hover:text-muted-foreground/60 transition-colors">—</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(dropdownContent, 'w-52')} align="start">
        <div className="py-1 max-h-56 overflow-y-auto">
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            onClick={() => { onChange(null); setOpen(false) }}
          >
            — Sin asignar
          </button>
          {users.map(u => (
            <button
              key={u.id}
              className={cn('w-full text-left px-3 py-1.5 hover:bg-muted/50 transition-colors flex items-center gap-2', value === u.id && 'bg-muted/30')}
              onClick={() => { onChange(u.id); setOpen(false) }}
            >
              <span className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground shrink-0">
                {initials(u.full_name)}
              </span>
              <span className="text-xs truncate flex-1">{u.full_name}</span>
              {value === u.id && <Check className="h-3 w-3 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ----------------------------------------------------------------
// Date popover with Calendar
// ----------------------------------------------------------------
function DateCell({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full min-h-[32px] flex items-center px-2 rounded hover:bg-muted/30 transition-colors gap-1.5 group">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
          {selected ? (
            <span className="text-xs">{format(selected, 'd MMM yyyy', { locale: es })}</span>
          ) : (
            <span className="text-muted-foreground/30 text-xs group-hover:text-muted-foreground/60 transition-colors">—</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-auto" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={d => {
            onChange(d ? format(d, 'yyyy-MM-dd') : null)
            setOpen(false)
          }}
          locale={es}
          initialFocus
        />
        {value && (
          <div className="border-t border-border px-3 py-2">
            <button
              onClick={() => { onChange(null); setOpen(false) }}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              Quitar fecha
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ----------------------------------------------------------------
// Text / Number / URL — inline input (no popover needed)
// ----------------------------------------------------------------
function InlineTextCell({ value, onChange, tipo }: {
  value:    string | null
  onChange: (v: string | null) => void
  tipo:     'text' | 'number' | 'url'
}) {
  const [editing, setEditing] = useState(false)
  const [v, setV] = useState(value ?? '')

  function save() { onChange(v.trim() || null); setEditing(false) }

  if (editing) {
    return (
      <input
        autoFocus
        type={tipo === 'number' ? 'number' : tipo === 'url' ? 'url' : 'text'}
        value={v}
        onChange={e => setV(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setV(value ?? ''); setEditing(false) } }}
        className="w-full min-w-[100px] text-xs px-2 py-1 bg-background border border-primary rounded outline-none"
      />
    )
  }

  return (
    <button
      className="w-full min-h-[32px] flex items-center px-2 rounded hover:bg-muted/30 transition-colors text-left"
      onClick={() => setEditing(true)}
    >
      {tipo === 'url' && value ? (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          onClick={e => { e.stopPropagation(); }}
          className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[140px]"
        >
          <ExternalLink className="h-3 w-3 shrink-0" />
          <span className="truncate">{value.replace(/^https?:\/\//, '')}</span>
        </a>
      ) : value ? (
        <span className="text-xs truncate block">{tipo === 'number' ? Number(value).toLocaleString('es-MX') : value}</span>
      ) : (
        <span className="text-muted-foreground/30 text-xs group-hover:text-muted-foreground/60 transition-colors">—</span>
      )}
    </button>
  )
}

// ----------------------------------------------------------------
// Priority popover
// ----------------------------------------------------------------
function PriorityCell({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const opt = PRIORITY_OPTIONS.find(o => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full min-h-[32px] flex items-center px-2 rounded hover:bg-muted/30 transition-colors gap-1 group">
          {opt ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: opt.color }}>
              {opt.label}
            </span>
          ) : (
            <span className="text-muted-foreground/30 text-xs group-hover:text-muted-foreground/60 transition-colors">—</span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={cn(dropdownContent, 'w-44')} align="start">
        <div className="py-1">
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
            onClick={() => { onChange(null); setOpen(false) }}
          >
            — Sin prioridad
          </button>
          {PRIORITY_OPTIONS.map(o => (
            <button
              key={o.value}
              className="w-full text-left px-3 py-1.5 hover:bg-muted/50 flex items-center gap-2"
              onClick={() => { onChange(o.value); setOpen(false) }}
            >
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: o.color }} />
              <span className="text-xs flex-1">{o.label}</span>
              {value === o.value && <Check className="h-3 w-3 text-primary shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ----------------------------------------------------------------
// Multi-selector popover
// ----------------------------------------------------------------
function MultiSelectorCell({ column, value, options, onChange, onOptionsUpdate }: {
  column:          TaskBoardColumnRow
  value:           string | null
  options:         SelectorOption[]
  onChange:        (v: string | null) => void
  onOptionsUpdate: (opts: SelectorOption[]) => void
}) {
  const [open,      setOpen]      = useState(false)
  const [newLabel,  setNewLabel]  = useState('')
  const [newColor,  setNewColor]  = useState(COLOR_PALETTE[0])
  const [adding,    setAdding]    = useState(false)
  const [saving,    setSaving]    = useState(false)

  let selected: string[] = []
  try { selected = value ? JSON.parse(value) : [] } catch { selected = [] }

  function toggle(val: string) {
    const next = selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val]
    onChange(next.length ? JSON.stringify(next) : null)
  }

  async function addOption() {
    const label = newLabel.trim()
    if (!label) return
    setSaving(true)
    const opt: SelectorOption = { value: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'), label, color: newColor }
    const updated = [...options, opt]
    await updateColumnConfig(column.id, { options: updated })
    onOptionsUpdate(updated)
    setNewLabel(''); setAdding(false); setSaving(false)
    setNewColor(COLOR_PALETTE[(options.length + 1) % COLOR_PALETTE.length])
  }

  const display = selected.length === 0
    ? <span className="text-muted-foreground/30 text-xs group-hover:text-muted-foreground/60 transition-colors">—</span>
    : (
      <div className="flex items-center gap-1 flex-wrap">
        {selected.slice(0, 2).map(v => {
          const opt = options.find(o => o.value === v)
          return opt ? (
            <span key={v} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-white" style={{ backgroundColor: opt.color ?? '#6b7280' }}>
              {opt.label}
            </span>
          ) : null
        })}
        {selected.length > 2 && <span className="text-[10px] text-muted-foreground">+{selected.length - 2}</span>}
      </div>
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full min-h-[32px] flex items-center px-2 rounded hover:bg-muted/30 transition-colors gap-1 group">
          {display}
          <ChevronDown className="h-3 w-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className={dropdownContent} align="start">
        <div className="py-1">
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50"
            onClick={() => { onChange(null); setOpen(false) }}
          >
            — Limpiar selección
          </button>
          {options.map(opt => (
            <button
              key={opt.value}
              className="w-full text-left px-3 py-1.5 hover:bg-muted/50 flex items-center gap-2"
              onClick={() => toggle(opt.value)}
            >
              <span className={cn('w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                selected.includes(opt.value) ? 'bg-primary border-primary' : 'border-border'
              )}>
                {selected.includes(opt.value) && <span className="text-[8px] text-white font-bold leading-none">✓</span>}
              </span>
              <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: opt.color ?? '#6b7280' }} />
              <span className="text-xs flex-1">{opt.label}</span>
            </button>
          ))}
          <div className="border-t border-border/40 mt-1 pt-1">
            {adding ? (
              <div className="px-3 py-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: newColor }} />
                  <input
                    autoFocus
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addOption(); if (e.key === 'Escape') setAdding(false) }}
                    placeholder="Nombre de la opción…"
                    disabled={saving}
                    className="flex-1 text-xs bg-transparent outline-none border-b border-muted-foreground/40 pb-0.5"
                  />
                </div>
                <ColorPicker value={newColor} onChange={setNewColor} />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setAdding(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancelar</button>
                  <button onClick={addOption} disabled={saving || !newLabel.trim()} className="text-xs text-primary hover:text-primary/80 disabled:opacity-40">Guardar</button>
                </div>
              </div>
            ) : (
              <button
                className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/50 flex items-center gap-1.5"
                onClick={() => setAdding(true)}
              >
                <Plus className="h-3 w-3" /> Agregar opción
              </button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ----------------------------------------------------------------
// Archivo cell (file upload)
// ----------------------------------------------------------------
function ArchivoCell({ taskId, value, onChange }: {
  taskId:   string
  value:    string | null
  onChange: (v: string | null) => void
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  let file: { url: string; name: string } | null = null
  try { file = value ? JSON.parse(value) : null } catch { /* invalid */ }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setUploading(true)
    try {
      const supabase = createClient()
      const ext = f.name.split('.').pop() ?? ''
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const path = `tasks/${taskId}/${Date.now()}-${safeName}`
      const { error } = await supabase.storage.from('media').upload(path, f)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
      onChange(JSON.stringify({ url: publicUrl, name: f.name }))
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  if (uploading) {
    return (
      <div className="flex items-center gap-1.5 px-2 min-h-[32px]">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Subiendo…</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 px-1 min-h-[32px] group">
      {file ? (
        <>
          <a
            href={file.url}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[110px]"
          >
            <Paperclip className="h-3 w-3 shrink-0" />
            <span className="truncate">{file.name}</span>
          </a>
          <button
            onClick={() => onChange(null)}
            className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all ml-auto shrink-0"
            title="Quitar archivo"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          <Paperclip className="h-3.5 w-3.5" />
          <span>Adjuntar</span>
        </button>
      )}
      <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

// ----------------------------------------------------------------
// TaskBoardCell — dispatcher
// ----------------------------------------------------------------
interface TaskBoardCellProps {
  column:               TaskBoardColumnRow
  value:                string | null
  users:                User[]
  taskId:               string
  allowedBusinessUnits: string[]
  onChange:             (value: string | null) => void
  onOptionsUpdate:      (columnId: string, opts: SelectorOption[]) => void
}

export function TaskBoardCell({ column, value, users, taskId, allowedBusinessUnits, onChange, onOptionsUpdate }: TaskBoardCellProps) {
  const cfg = parseConfig(column.config)

  const handleOptionsUpdate = useCallback((opts: SelectorOption[]) => {
    onOptionsUpdate(column.id, opts)
  }, [column.id, onOptionsUpdate])

  if (column.tipo === 'selector') {
    return (
      <SelectorCell
        column={column}
        value={value}
        options={cfg.options ?? []}
        onChange={onChange}
        onOptionsUpdate={handleOptionsUpdate}
      />
    )
  }

  if (column.tipo === 'multi_selector') {
    return (
      <MultiSelectorCell
        column={column}
        value={value}
        options={cfg.options ?? []}
        onChange={onChange}
        onOptionsUpdate={handleOptionsUpdate}
      />
    )
  }

  if (column.tipo === 'priority') {
    return <PriorityCell value={value} onChange={onChange} />
  }

  if (column.tipo === 'archivo') {
    return <ArchivoCell taskId={taskId} value={value} onChange={onChange} />
  }

  if (column.tipo === 'business_unit') {
    return <BusinessUnitCell value={value} onChange={onChange} allowedBusinessUnits={allowedBusinessUnits} />
  }

  if (column.tipo === 'person') {
    return <PersonCell users={users} value={value} onChange={onChange} />
  }

  if (column.tipo === 'date') {
    return <DateCell value={value} onChange={onChange} />
  }

  return <InlineTextCell value={value} onChange={onChange} tipo={column.tipo as 'text' | 'number' | 'url'} />
}
