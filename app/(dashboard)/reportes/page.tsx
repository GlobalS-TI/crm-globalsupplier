import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityReportService, computeIndicators, summarizeReport } from '@/lib/services/OpportunityReportService'
import { OpportunityReportFilters } from '@/components/crm/OpportunityReportFilters'
import { OpportunityReportExportButtons } from '@/components/crm/OpportunityReportExportButtons'
import { OpportunityReportTable } from '@/components/crm/OpportunityReportTable'
import { OpportunityReportIndicatorsPanel } from '@/components/crm/OpportunityReportIndicatorsPanel'
import { ReportViewTabs, type ReportView } from '@/components/crm/ReportViewTabs'
import { formatMXN } from '@/lib/utils/currency'
import { businessMonthRange } from '@/lib/utils/date'
import { REPORT_OWNER_FILTER_ROLES } from '@/lib/types'
import type { UserRole } from '@/lib/types'

export const metadata = { title: 'Reportes | Supply' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ReportesPage({ searchParams }: PageProps) {
  const sp   = await searchParams
  const view: ReportView = sp.vista === 'indicadores' ? 'indicadores' : 'detalle'

  // Sin rango se abre en el mes actual. Se redirige (en vez de aplicarlo en silencio) para
  // que los filtros muestren las fechas y el export/las pestañas lleven el mismo rango.
  if (!sp.desde && !sp.hasta) {
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(sp)) if (value !== undefined) next.set(key, value)
    const { desde, hasta } = businessMonthRange(new Date())
    next.set('desde', desde)
    next.set('hasta', hasta)
    redirect(`/reportes?${next.toString()}` as Route)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const role = (currentProfile?.role ?? '') as UserRole
  const canFilterByOwner = REPORT_OWNER_FILTER_ROLES.includes(role)

  const [rows, profilesResult] = await Promise.all([
    new OpportunityReportService(new OpportunityRepository())
      .listOpportunities({ ...sp, owner: canFilterByOwner ? sp.owner : undefined }),
    canFilterByOwner
      ? supabase.from('profiles').select('id, full_name').order('full_name')
      : Promise.resolve({ data: [] }),
  ])
  const profiles = profilesResult.data ?? []
  const summary  = summarizeReport(rows)

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            <h1 className="text-2xl font-bold">Reportes comerciales</h1>
            <ReportViewTabs current={view} params={sp} />
          </div>
          <OpportunityReportExportButtons rows={rows} />
        </div>
        <Suspense>
          <OpportunityReportFilters profiles={profiles} canFilterByOwner={canFilterByOwner} />
        </Suspense>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-sm text-muted-foreground mb-4">
          {summary.count} oportunidad{summary.count !== 1 ? 'es' : ''}
          {summary.count > 0 && <> · monto estimado ≈ {formatMXN(summary.montoEstimadoMxn)}</>}
        </p>
        {view === 'indicadores'
          ? <OpportunityReportIndicatorsPanel indicators={computeIndicators(rows)} fecha={sp.fecha === 'creacion' ? 'creacion' : 'cierre'} />
          : <OpportunityReportTable rows={rows} />}
      </div>
    </div>
  )
}
