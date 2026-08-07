import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { ActivityRepository } from '@/lib/repositories/supabase/ActivityRepository'
import { ActivityService } from '@/lib/services/ActivityService'
import { OpportunityForm } from '@/components/crm/OpportunityForm'
import { StageTransitionModal } from '@/components/crm/StageTransitionModal'
import { GanadoStageButton } from '@/components/crm/GanadoStageButton'
import { QuickStageButton } from '@/components/crm/QuickStageButton'
import { ActivityTimeline } from '@/components/crm/ActivityTimeline'
import { ActivityForm } from '@/components/crm/ActivityForm'
import { StaleBadge } from '@/components/crm/StaleBadge'
import { DeleteButton } from '@/components/crm/DeleteButton'
import { JunoPipelinePanel } from '@/components/crm/JunoPipelinePanel'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { updateOpportunity, moveToStage, deleteOpportunity } from '../actions'
import { createActivity } from '@/app/(dashboard)/actividades/actions'
import { QuoteRepository } from '@/lib/repositories/supabase/QuoteRepository'
import { OrderRepository } from '@/lib/repositories/supabase/OrderRepository'
import { InvoiceRepository } from '@/lib/repositories/supabase/InvoiceRepository'
import type { OpportunityStage } from '@/lib/validations/opportunity'
import type { OrderProviderRow } from '@/lib/repositories/interfaces/IOrderRepository'
import type { InvoiceRow } from '@/lib/repositories/interfaces/IInvoiceRepository'

export const dynamic = 'force-dynamic'

const STAGE_LABELS: Record<OpportunityStage, string> = {
  nuevo_lead: 'Nuevo lead', contactado: 'Contactado', diagnostico: 'Diagnóstico',
  cotizacion_enviada: 'Cotización enviada', seguimiento: 'Seguimiento',
  negociacion: 'Negociación', ganado: 'Ganado', perdido: 'Perdido',
}

const ALL_STAGES: OpportunityStage[] = [
  'nuevo_lead', 'contactado', 'diagnostico', 'cotizacion_enviada',
  'seguimiento', 'negociacion', 'ganado', 'perdido',
]

export default async function OportunidadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [opp, activities, companiesResult, profilesResult, userResult] = await Promise.all([
    new OpportunityService(new OpportunityRepository()).getById(id).catch(() => null),
    new ActivityService(new ActivityRepository()).getByOpportunity(id),
    supabase.from('companies').select('id, nombre').order('nombre'),
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.auth.getUser(),
  ])

  if (!opp) notFound()

  const companies     = companiesResult.data ?? []
  const profiles      = profilesResult.data ?? []
  const currentUserId = userResult.data.user?.id ?? ''
  const isClosed      = opp.etapa === 'ganado' || opp.etapa === 'perdido'
  const boundMove     = moveToStage.bind(null, id)

  const isJuno = opp.business_unit === 'juno_promotional'
  let junoData: {
    quotes: Awaited<ReturnType<QuoteRepository['findByOpportunity']>>
    orders: Awaited<ReturnType<OrderRepository['findByOpportunity']>>
    providersByOrder: Record<string, OrderProviderRow[]>
    invoicesByOrder: Record<string, InvoiceRow[]>
  } | null = null

  if (isJuno) {
    const quoteRepo = new QuoteRepository()
    const orderRepo = new OrderRepository()
    const invoiceRepo = new InvoiceRepository()

    const [quotes, orders] = await Promise.all([
      quoteRepo.findByOpportunity(id),
      orderRepo.findByOpportunity(id),
    ])

    const providersByOrder: Record<string, OrderProviderRow[]> = {}
    const invoicesByOrder: Record<string, InvoiceRow[]> = {}
    await Promise.all(orders.map(async o => {
      const [providers, invoices] = await Promise.all([
        orderRepo.listProviders(o.id),
        invoiceRepo.findByOrder(o.id),
      ])
      providersByOrder[o.id] = providers
      invoicesByOrder[o.id]  = invoices
    }))

    junoData = { quotes, orders, providersByOrder, invoicesByOrder }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Link href={'/oportunidades' as Route} className="text-sm text-muted-foreground hover:underline">
          ← Oportunidades
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">{opp.nombre}</h1>
          <Badge variant={isClosed ? 'secondary' : 'default'}>
            {STAGE_LABELS[opp.etapa as OpportunityStage]}
          </Badge>
          {opp.stale && <StaleBadge />}
        </div>
        {opp.company && <p className="text-muted-foreground">{opp.company.nombre}</p>}
      </div>

      {/* Stage transitions */}
      {!isClosed && (
        <>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cambiar etapa</p>
            <div className="flex flex-wrap gap-2">
              {ALL_STAGES.filter(s => s !== opp.etapa).map(stage =>
                stage === 'ganado' ? (
                  <GanadoStageButton key="ganado" oppId={id} oppName={opp.nombre} />
                ) : stage === 'perdido' ? (
                  <StageTransitionModal key="perdido" targetStage="perdido" action={boundMove} />
                ) : (
                  <QuickStageButton key={stage} label={STAGE_LABELS[stage]} stage={stage} action={boundMove} />
                )
              )}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Two-column layout: edit form + activity timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Edit form */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Datos de la oportunidad</h2>
          <OpportunityForm
            action={updateOpportunity.bind(null, id)}
            defaultValues={opp}
            profiles={profiles}
            companies={companies}
            currentUserId={currentUserId}
            submitLabel="Guardar cambios"
          />
        </div>

        {/* Activities */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Actividades</h2>

          {/* Add activity form */}
          <div className="border rounded-lg p-4 bg-muted/30">
            <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Nueva actividad</p>
            <ActivityForm opportunityId={id} action={createActivity} />
          </div>

          {/* Timeline */}
          <ActivityTimeline activities={activities} opportunityId={id} />
        </div>
      </div>

      {junoData && (
        <>
          <Separator />
          <JunoPipelinePanel
            opportunityId={id}
            quotes={junoData.quotes}
            orders={junoData.orders}
            providersByOrder={junoData.providersByOrder}
            invoicesByOrder={junoData.invoicesByOrder}
          />
        </>
      )}

      <Separator />

      {/* Delete */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zona peligrosa</p>
        <DeleteButton
          action={deleteOpportunity.bind(null, id)}
          label="Eliminar oportunidad"
          confirmMessage={`¿Eliminar "${opp.nombre}"? Esta acción no se puede deshacer.`}
        />
      </div>
    </div>
  )
}
