import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ITTicketTable } from '@/components/crm/ITTicketTable'
import { ITTicketKpiPanel } from '@/components/crm/ITTicketKpiPanel'
import { createClient } from '@/lib/supabase/server'
import { ITTicketService } from '@/lib/services/ITTicketService'
import { ITTicketRepository } from '@/lib/repositories/supabase/ITTicketRepository'
import { ProfileRepository } from '@/lib/repositories/supabase/ProfileRepository'
import {
  IT_ROLES, IT_TICKET_STATUSES, IT_TICKET_STATUS_LABELS,
  IT_TICKET_PRIORITIES, IT_TICKET_PRIORITY_LABELS,
} from '@/lib/types'
import type { UserRole, ITTicketStatus, ITTicketPriority } from '@/lib/types'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Soporte TI | Supply' }
export const dynamic  = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ status?: string; priority?: string; tab?: string }>
}

export default async function SoporteTiPage({ searchParams }: PageProps) {
  const { status, priority, tab } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, it_staff')
    .eq('id', user.id)
    .single()

  // Gate de UI únicamente — la visibilidad real de tickets la garantiza RLS
  // (it_tickets_select), sin importar lo que se filtre aquí. it_staff da acceso
  // de gestión aunque el rol principal del perfil sea otro (ej. administracion).
  const isOversight = IT_ROLES.includes((profile?.role ?? 'vendedor') as UserRole) || !!profile?.it_staff

  const service = new ITTicketService(new ITTicketRepository(), new ProfileRepository())

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name')
  const profilesById = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  const showKpi = isOversight && tab === 'kpi'

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Soporte TI</h1>
        <Button asChild size="sm">
          <Link href={'/soporte-ti/nuevo' as Route}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo ticket
          </Link>
        </Button>
      </div>

      {isOversight && (
        <div className="flex gap-1 border-b">
          <Link
            href={'/soporte-ti' as Route}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              !showKpi ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            Cola de tickets
          </Link>
          <Link
            href={'/soporte-ti?tab=kpi' as Route}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              showKpi ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            KPIs
          </Link>
        </div>
      )}

      {showKpi ? (
        <ITTicketKpiPanel summary={await service.getKpiSummary()} />
      ) : (
        <>
          {isOversight && (
            <div className="flex flex-wrap gap-2">
              <FilterChips
                param="status"
                current={status}
                options={[{ value: '', label: 'Todos los estados' }, ...IT_TICKET_STATUSES.map(s => ({ value: s, label: IT_TICKET_STATUS_LABELS[s] }))]}
                currentPriority={priority}
              />
              <FilterChips
                param="priority"
                current={priority}
                options={[{ value: '', label: 'Todas las prioridades' }, ...IT_TICKET_PRIORITIES.map(p => ({ value: p, label: IT_TICKET_PRIORITY_LABELS[p] }))]}
                currentStatus={status}
              />
            </div>
          )}

          <ITTicketTable
            tickets={await service.listTickets(isOversight
              ? {
                  ...(status   && IT_TICKET_STATUSES.includes(status as ITTicketStatus)     && { status:   status   as ITTicketStatus }),
                  ...(priority && IT_TICKET_PRIORITIES.includes(priority as ITTicketPriority) && { priority: priority as ITTicketPriority }),
                }
              : { requesterId: user.id })}
            profilesById={profilesById}
            showRequester={isOversight}
            showAssignee={isOversight}
            emptyMessage={isOversight ? 'Sin tickets registrados.' : 'No has creado ningún ticket todavía.'}
          />
        </>
      )}
    </div>
  )
}

// ---- Filter chips (server-rendered links) ----
function FilterChips({
  param, current, options, currentStatus, currentPriority,
}: {
  param: 'status' | 'priority'
  current?: string
  options: { value: string; label: string }[]
  currentStatus?: string
  currentPriority?: string
}) {
  function buildHref(value: string) {
    const p = new URLSearchParams()
    if (param === 'status'   && value)           p.set('status', value)
    if (param === 'status'   && currentPriority) p.set('priority', currentPriority)
    if (param === 'priority' && value)           p.set('priority', value)
    if (param === 'priority' && currentStatus)   p.set('status', currentStatus)
    const qs = p.toString()
    return (`/soporte-ti${qs ? `?${qs}` : ''}`) as Route
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = (opt.value === '' && !current) || opt.value === current
        return (
          <Link
            key={opt.value}
            href={buildHref(opt.value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border text-muted-foreground'
            }`}
          >
            {opt.label}
          </Link>
        )
      })}
    </div>
  )
}
