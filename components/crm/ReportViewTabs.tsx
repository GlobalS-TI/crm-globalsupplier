import Link from 'next/link'
import type { Route } from 'next'
import { cn } from '@/lib/utils'

export type ReportView = 'detalle' | 'indicadores'

const VIEWS: { value: ReportView; label: string }[] = [
  { value: 'detalle',     label: 'Detalle' },
  { value: 'indicadores', label: 'Indicadores' },
]

interface ReportViewTabsProps {
  current: ReportView
  params:  Record<string, string | undefined>
}

// Cambia de vista conservando los filtros: detalle e indicadores muestran el mismo conjunto.
export function ReportViewTabs({ current, params }: ReportViewTabsProps) {
  function hrefFor(view: ReportView): Route {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && key !== 'vista') next.set(key, value)
    }
    if (view !== 'detalle') next.set('vista', view)
    const qs = next.toString()
    return `/reportes${qs ? `?${qs}` : ''}` as Route
  }

  return (
    <div className="flex items-center border rounded-md overflow-hidden h-8">
      {VIEWS.map(v => (
        <Link
          key={v.value}
          href={hrefFor(v.value)}
          className={cn(
            'flex items-center px-3 h-full text-xs transition-colors',
            current === v.value
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-muted-foreground',
          )}
        >
          {v.label}
        </Link>
      ))}
    </div>
  )
}
