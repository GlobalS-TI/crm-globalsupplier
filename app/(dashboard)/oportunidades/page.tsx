import Link from 'next/link'
import type { Route } from 'next'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { OpportunityKanbanBoard } from '@/components/crm/OpportunityKanbanBoard'
import { OpportunityTable } from '@/components/crm/OpportunityTable'
import { OpportunityFilters } from '@/components/crm/OpportunityFilters'
import { ViewToggle } from '@/components/crm/ViewToggle'
import { Button } from '@/components/ui/button'
import type { OpportunityFilters as Filters } from '@/lib/repositories/interfaces/IOpportunityRepository'
import type { OpportunityStage, BusinessUnit } from '@/lib/validations/opportunity'

export const metadata = { title: 'Oportunidades — CRM Global Supplier' }
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function OportunidadesPage({ searchParams }: PageProps) {
  const sp = await searchParams

  const view  = sp.view === 'list' ? 'list' : 'kanban'
  const filters: Filters = {
    ...(sp.owner  && { ownerId:      sp.owner }),
    ...(sp.unit   && { businessUnit: sp.unit  as BusinessUnit }),
    ...(sp.stage  && { stage:        sp.stage as OpportunityStage }),
    ...(sp.stale === 'true' && { stale: true }),
  }

  const supabase = await createClient()
  const [opportunities, profilesResult] = await Promise.all([
    new OpportunityService(new OpportunityRepository()).listPipeline(filters),
    supabase.from('profiles').select('id, full_name').order('full_name'),
  ])
  const profiles = profilesResult.data ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold shrink-0">Oportunidades</h1>
        <div className="flex items-center gap-3 flex-wrap flex-1 justify-end">
          <Suspense>
            <OpportunityFilters profiles={profiles} />
            <ViewToggle />
          </Suspense>
          <Button asChild size="sm">
            <Link href={'/oportunidades/nueva' as Route}>+ Nueva</Link>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'kanban' ? (
          <div className="h-full py-4">
            <OpportunityKanbanBoard opportunities={opportunities} />
          </div>
        ) : (
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">
              {opportunities.length} oportunidad{opportunities.length !== 1 ? 'es' : ''}
            </p>
            <OpportunityTable opportunities={opportunities} />
          </div>
        )}
      </div>
    </div>
  )
}
