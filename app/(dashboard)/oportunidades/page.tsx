import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { OpportunityKanbanBoard } from '@/components/crm/OpportunityKanbanBoard'

export const metadata = { title: 'Oportunidades — CRM Global Supplier' }
export const dynamic = 'force-dynamic'

export default async function OportunidadesPage() {
  const service       = new OpportunityService(new OpportunityRepository())
  const opportunities = await service.listPipeline()

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-5 border-b">
        <h1 className="text-2xl font-bold">Oportunidades</h1>
      </div>
      <div className="flex-1 overflow-hidden py-4">
        <OpportunityKanbanBoard opportunities={opportunities} />
      </div>
    </div>
  )
}
