import { createClient } from '@/lib/supabase/server'
import { ActivityRepository } from '@/lib/repositories/supabase/ActivityRepository'
import { ActivityService } from '@/lib/services/ActivityService'
import { ActivityCard } from '@/components/crm/ActivityCard'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle } from 'lucide-react'

export const metadata = { title: 'Actividades — CRM Global Supplier' }
export const dynamic = 'force-dynamic'

export default async function ActividadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const activities = await new ActivityService(new ActivityRepository())
    .getPendingByUser(user.id)

  const now      = new Date()
  const overdue  = activities.filter(a => new Date(a.fecha) < now)
  const upcoming = activities.filter(a => new Date(a.fecha) >= now)

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
            {overdue.map(a => <ActivityCard key={a.id} act={a} />)}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Próximas ({upcoming.length})
          </p>
          <div className="space-y-2">
            {upcoming.map(a => <ActivityCard key={a.id} act={a} />)}
          </div>
        </section>
      )}
    </div>
  )
}
