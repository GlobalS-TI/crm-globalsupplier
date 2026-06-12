import Link from 'next/link'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ActivityRepository } from '@/lib/repositories/supabase/ActivityRepository'
import { ActivityService } from '@/lib/services/ActivityService'
import { completeActivity, deleteActivity } from './actions'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Actividades — CRM Global Supplier' }
export const dynamic = 'force-dynamic'

const TYPE_LABELS: Record<string, string> = {
  llamada: 'Llamada', email: 'Email', reunion: 'Reunión', demo: 'Demo',
  propuesta: 'Propuesta', seguimiento: 'Seguimiento', otro: 'Otro',
}

export default async function ActividadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const activities = await new ActivityService(new ActivityRepository())
    .getPendingByUser(user.id)

  const now      = new Date()
  const overdue  = activities.filter(a => new Date(a.fecha) < now)
  const upcoming = activities.filter(a => new Date(a.fecha) >= now)

  function ActivityRow({ act }: { act: typeof activities[number] }) {
    const fecha    = new Date(act.fecha)
    const isOver   = fecha < now
    return (
      <div className={`flex items-start gap-3 p-3 rounded-lg border ${isOver ? 'border-destructive/50 bg-destructive/5' : 'bg-card'}`}>
        <div className={`mt-0.5 shrink-0 ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
          {isOver ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">{TYPE_LABELS[act.tipo]}</span>
            <span className={`text-xs font-medium ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
              {fecha.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
              {' '}
              {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm font-medium truncate">{act.titulo}</p>
          {act.opportunity && (
            <Link
              href={`/oportunidades/${act.opportunity.id}` as Route}
              className="text-xs text-primary hover:underline truncate block"
            >
              {act.opportunity.nombre}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <form action={completeActivity.bind(null, act.id, act.opportunity_id)}>
            <button type="submit" title="Completar" className="text-primary hover:opacity-70">
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </form>
          <form action={deleteActivity.bind(null, act.id, act.opportunity_id)}>
            <button
              type="submit" title="Eliminar"
              className="text-muted-foreground hover:text-destructive"
              onClick={e => { if (!confirm('¿Eliminar actividad?')) e.preventDefault() }}
            >
              <XCircle className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis actividades</h1>
        <Badge variant="outline">{activities.length} pendiente{activities.length !== 1 ? 's' : ''}</Badge>
      </div>

      {activities.length === 0 && (
        <p className="text-muted-foreground text-sm">No tienes actividades pendientes.</p>
      )}

      {overdue.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-semibold text-destructive flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" /> Vencidas ({overdue.length})
          </p>
          <div className="space-y-2">
            {overdue.map(a => <ActivityRow key={a.id} act={a} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Próximas ({upcoming.length})
          </p>
          <div className="space-y-2">
            {upcoming.map(a => <ActivityRow key={a.id} act={a} />)}
          </div>
        </section>
      )}
    </div>
  )
}
