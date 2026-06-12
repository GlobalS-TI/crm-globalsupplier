'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Route } from 'next'

export function ViewToggle() {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const current  = params.get('view') ?? 'kanban'

  function setView(view: string) {
    const next = new URLSearchParams(params.toString())
    next.set('view', view)
    router.push(`${pathname}?${next.toString()}` as Route)
  }

  return (
    <div className="flex items-center border rounded-md overflow-hidden h-8">
      <button
        onClick={() => setView('kanban')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-full text-xs transition-colors',
          current === 'kanban'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent text-muted-foreground'
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" /> Kanban
      </button>
      <button
        onClick={() => setView('list')}
        className={cn(
          'flex items-center gap-1.5 px-2.5 h-full text-xs transition-colors',
          current === 'list'
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent text-muted-foreground'
        )}
      >
        <List className="h-3.5 w-3.5" /> Lista
      </button>
    </div>
  )
}
