import { createClient } from '@/lib/supabase/server'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { StatCard } from '@/components/crm/dashboard/StatCard'
import { StaleNotifyButton } from '@/components/crm/dashboard/StaleNotifyButton'

const fmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const FULL_ACCESS_ROLES = ['director_general', 'direccion_comercial']

export const metadata = { title: 'Dashboard — CRM Global Supplier' }
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const [stats, { data: { user } }] = await Promise.all([
    new OpportunityService(new OpportunityRepository()).getDashboardStats(),
    supabase.auth.getUser(),
  ])

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const canNotify = FULL_ACCESS_ROLES.includes(profile?.role ?? '')

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {canNotify && <StaleNotifyButton />}
      </div>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Pipeline</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Oportunidades abiertas" value={stats.openCount} />
          <StatCard title="Ganadas"                 value={stats.wonCount} />
          <StatCard title="Perdidas"                value={stats.lostCount} />
          <StatCard
            title="Sin actividad"
            value={stats.staleCount}
            className={stats.staleCount > 0 ? 'border-destructive' : undefined}
          />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Valor</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <StatCard title="Pipeline total"       value={fmt.format(stats.totalPipeline)} />
          <StatCard title="Ganado este mes"      value={fmt.format(stats.wonThisMonth)} />
          <StatCard title="Pronóstico ponderado" value={fmt.format(stats.weightedForecast)} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Actividades</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Pendientes" value={stats.pendingActivities} />
          <StatCard
            title="Vencidas"
            value={stats.overdueActivities}
            className={stats.overdueActivities > 0 ? 'border-destructive' : undefined}
          />
        </div>
      </section>
    </div>
  )
}
