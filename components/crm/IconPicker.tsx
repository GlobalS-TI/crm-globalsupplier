'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  FileText, FileVideo, BookOpen, Book, ClipboardList, Monitor,
  LayoutTemplate, Image, Video, Folder, FolderOpen, Archive, Package,
  Briefcase, Building2, Users, PenLine, Star, Tag, Globe, Camera,
  PlayCircle, Headphones, Mail, Layers, Film, Palette, Link, Trophy,
  type LucideIcon,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const ICON_MAP: Record<string, LucideIcon> = {
  FileText, FileVideo, BookOpen, Book, ClipboardList, Monitor,
  LayoutTemplate, Image, Video, Folder, FolderOpen, Archive, Package,
  Briefcase, Building2, Users, PenLine, Star, Tag, Globe, Camera,
  PlayCircle, Headphones, Mail, Layers, Film, Palette, Link, Trophy,
}

const ICONS: { name: string; label: string }[] = [
  { name: 'FileText',       label: 'Documento' },
  { name: 'Book',           label: 'Manual' },
  { name: 'BookOpen',       label: 'Catálogo' },
  { name: 'ClipboardList',  label: 'Ficha técnica' },
  { name: 'Layers',         label: 'Capas' },
  { name: 'LayoutTemplate', label: 'Plantilla' },
  { name: 'Video',          label: 'Video' },
  { name: 'Film',           label: 'Película' },
  { name: 'FileVideo',      label: 'Archivo video' },
  { name: 'PlayCircle',     label: 'Reproducir' },
  { name: 'Monitor',        label: 'Presentación' },
  { name: 'Image',          label: 'Imagen' },
  { name: 'Palette',        label: 'Diseño / Logo' },
  { name: 'Camera',         label: 'Foto' },
  { name: 'Headphones',     label: 'Audio' },
  { name: 'Folder',         label: 'Folder' },
  { name: 'FolderOpen',     label: 'Folder abierto' },
  { name: 'Archive',        label: 'Archivo' },
  { name: 'Package',        label: 'Paquete' },
  { name: 'Briefcase',      label: 'Portafolio' },
  { name: 'Building2',      label: 'Empresa' },
  { name: 'Users',          label: 'Equipo' },
  { name: 'Trophy',         label: 'Premio' },
  { name: 'PenLine',        label: 'Firma' },
  { name: 'Star',           label: 'Favorito' },
  { name: 'Tag',            label: 'Etiqueta' },
  { name: 'Globe',          label: 'Web' },
  { name: 'Link',           label: 'Enlace' },
  { name: 'Mail',           label: 'Email' },
]

export { ICON_MAP }

interface Props {
  name:          string
  defaultValue?: string | null
}

export function IconPicker({ name, defaultValue }: Props) {
  const [value, setValue] = useState(defaultValue ?? '')
  const [query, setQuery] = useState('')
  const [open, setOpen]   = useState(false)

  const SelectedIcon = ICON_MAP[value]
  const filtered = ICONS.filter(i =>
    query === '' ||
    i.label.toLowerCase().includes(query.toLowerCase()) ||
    i.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />

      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 h-9 px-3 w-full rounded-md border border-input bg-background text-sm hover:bg-accent transition-colors text-left"
      >
        {SelectedIcon ? (
          <>
            <SelectedIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-muted-foreground">{ICONS.find(i => i.name === value)?.label ?? value}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Seleccionar ícono…</span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border rounded-md shadow-md p-2 space-y-2 min-w-[240px]">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar ícono…"
                className="h-7 pl-7 text-xs"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-5 gap-1 max-h-52 overflow-y-auto pr-0.5">
              {filtered.map(icon => {
                const Icon = ICON_MAP[icon.name]
                const isSelected = value === icon.name
                return (
                  <button
                    key={icon.name}
                    type="button"
                    title={icon.label}
                    onClick={() => { setValue(icon.name); setOpen(false); setQuery('') }}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-md text-center transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-muted-foreground hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-[9px] leading-tight line-clamp-2">{icon.label}</span>
                  </button>
                )
              })}

              {filtered.length === 0 && (
                <p className="col-span-5 text-xs text-muted-foreground text-center py-3">Sin resultados</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
