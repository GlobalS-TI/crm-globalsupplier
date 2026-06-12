import { createClient } from '@/lib/supabase/server'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { ActivityRepository } from '@/lib/repositories/supabase/ActivityRepository'
import { ActivityService } from '@/lib/services/ActivityService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/crm/dashboard/StatCard'
import { StaleNotifyButton } from '@/components/crm/dashboard/StaleNotifyButton'
import { SalesByUnitChart } from '@/components/crm/dashboard/SalesByUnitChart'
import { PipelineByOwnerChart } from '@/components/crm/dashboard/PipelineByOwnerChart'
import { ForecastChart } from '@/components/crm/dashboard/ForecastChart'
import { GlobalActivitiesPanel } from '@/components/crm/dashboard/GlobalActivitiesPanel'

const fmtCurrency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const FULL_ACCESS = ['director_general', 'direccion_comercial']

export const metadata = { title: 'Dashboard — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0) return undefined
  return ((current - previous) / previous) * 100
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    exec,
    legacyStats,
    globalActivities,
    { data: { user } },
  ] = await Promise.all([
    new OpportunityService(new OpportunityRepository()).getExecutiveDashboard(),
    new OpportunityService(new OpportunityRepository()).getDashboardStats(),
    new ActivityService(new ActivityRepository()).getGlobalPending(),
    supabase.auth.getUser(),
  ])

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const canNotify    = FULL_ACCESS.includes(profile?.role ?? '')
  const salesTrend   = pctChange(exec.kpis.wonThisMonth, exec.kpis.wonLastMonth)
  const overdueCount = globalActivities.filter(a => new Date(a.fecha) < new Date()).length

  return (
    <div className="p-8 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {canNotify && <StaleNotifyButton />}
      </div>

      {/* KPIs del mes */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">KPIs del mes</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Ganado este mes"
            value={fmtCurrency.format(exec.kpis.wonThisMonth)}
            trend={salesTrend}
            trendLabel="vs mes anterior"
          />
          <StatCard
            title="Pipeline total"
            value={fmtCurrency.format(exec.kpis.pipelineTotal)}
          />
          <StatCard
            title="Pronóstico ponderado"
            value={fmtCurrency.format(legacyStats.weightedForecast)}
          />
          <StatCard
            title="Oportunidades abiertas"
            value={exec.kpis.opportunitiesOpen}
            sub={`${exec.kpis.newThisMonth} nuevas este mes`}
          />
          <StatCard
            title="Sin actividad"
            value={legacyStats.staleCount}
            className={legacyStats.staleCount > 0 ? 'border-destructive' : undefined}
          />
        </div>
      </section>

      {/* Gráficas */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Ventas por unidad de negocio</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesByUnitChart data={exec.salesByUnit} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pipeline ponderado por vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <PipelineByOwnerChart data={exec.pipelineByOwner} />
          </CardContent>
        </Card>
      </section>

      {/* Forecast por etapa */}
      <section>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Forecast de ventas — pipeline por etapa</CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastChart data={exec.forecastByStage} />
          </CardContent>
        </Card>
      </section>

      {/* Actividades globales */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Actividades pendientes globales
          </h2>
          {overdueCount > 0 && (
            <span className="text-xs font-medium text-destructive">
              {overdueCount} vencida{overdueCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <GlobalActivitiesPanel activities={globalActivities} />
      </section>

      {/* Pipeline counters */}
      <section>
        <h2 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Conteos de pipeline</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Oportunidades abiertas" value={legacyStats.openCount} />
          <StatCard title="Ganadas (total)"        value={legacyStats.wonCount} />
          <StatCard title="Perdidas (total)"        value={legacyStats.lostCount} />
          <StatCard
            title="Actividades vencidas"
            value={legacyStats.overdueActivities}
            className={legacyStats.overdueActivities > 0 ? 'border-destructive' : undefined}
          />
        </div>
      </section>

    </div>
  )
}
