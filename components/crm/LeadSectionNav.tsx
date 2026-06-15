'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { Users, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CreateSectionButton, EditSectionButton } from '@/components/crm/LeadSectionModal'
import { deleteSection } from '@/app/(dashboard)/leads/actions'
import type { LeadSectionWithCount } from '@/lib/repositories/interfaces/ILeadRepository'

function DeleteSectionButton({ section }: { section: LeadSectionWithCount }) {
  const [pending, start] = useTransition()
  const count = Number(section.leads?.[0]?.count ?? 0)

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={pending}
          className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar sección?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminarán &quot;{section.nombre}&quot; y todos sus{' '}
            {count > 0 ? `${count} leads` : 'leads'}. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => start(async () => { await deleteSection(section.id) })}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface Props {
  sections:       LeadSectionWithCount[]
  selectedId:     string | undefined
  isLeadsManager: boolean
}

export function LeadSectionNav({ sections, selectedId, isLeadsManager }: Props) {
  return (
    <aside className="w-56 shrink-0 border-r h-full overflow-y-auto bg-card flex flex-col">
      <div className="flex-1 px-3 py-4 space-y-0.5">
        {sections.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">Sin secciones aún</p>
        )}
        {sections.map(sec => {
          const isActive = sec.id === selectedId
          const count    = Number(sec.leads?.[0]?.count ?? 0)

          return (
            <div key={sec.id} className="group flex items-center gap-1">
              <Link
                href={`/leads?sec=${sec.id}`}
                className={cn(
                  'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors min-w-0',
                  isActive
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1">{sec.nombre}</span>
                {count > 0 && (
                  <span className={cn(
                    'text-xs tabular-nums shrink-0 rounded-full px-1.5',
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {count}
                  </span>
                )}
              </Link>

              {isLeadsManager && (
                <div className="flex items-center shrink-0">
                  <EditSectionButton section={sec} />
                  <DeleteSectionButton section={sec} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isLeadsManager && (
        <div className="border-t px-3 py-2">
          <CreateSectionButton />
        </div>
      )}
    </aside>
  )
}
