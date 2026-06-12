import { createClient } from '@/lib/supabase/server'
import type {
  IOpportunityRepository,
  OpportunityRow,
  OpportunityWithRelations,
  OpportunityFilters,
  DashboardStats,
  ExecutiveDashboard,
  SalesByUnit,
  PipelineByOwner,
  ForecastByStage,
} from '@/lib/repositories/interfaces/IOpportunityRepository'
import type { BusinessUnit, OpportunityStage } from '@/lib/validations/opportunity'
import type { CreateOpportunityInput, UpdateOpportunityInput } from '@/lib/validations/opportunity'
import type { Database } from '@/lib/types/database'

type OppInsert = Database['public']['Tables']['opportunities']['Insert']
type OppUpdate = Database['public']['Tables']['opportunities']['Update']

// Zod infers undefined for optional fields; Supabase Insert/Update expect null | undefined.
// This cast is the boundary between the validation layer and the persistence layer.
const toInsert = (d: CreateOpportunityInput): OppInsert => d as unknown as OppInsert
const toUpdate = (d: UpdateOpportunityInput): OppUpdate => d as unknown as OppUpdate

const WITH_RELATIONS = '*, company:companies(nombre), contact:contacts(nombre, apellido), owner:profiles!owner_id(full_name)'

export class OpportunityRepository implements IOpportunityRepository {
  async findById(id: string): Promise<OpportunityWithRelations | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('opportunities')
      .select(WITH_RELATIONS)
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data as OpportunityWithRelations | null
  }

  async findAll(filters: OpportunityFilters = {}): Promise<OpportunityWithRelations[]> {
    const supabase = await createClient()
    let query = supabase.from('opportunities').select(WITH_RELATIONS)

    if (filters.ownerId)      query = query.eq('owner_id', filters.ownerId)
    if (filters.businessUnit) query = query.eq('business_unit', filters.businessUnit)
    if (filters.stage)        query = query.eq('etapa', filters.stage)
    if (filters.stale !== undefined) query = query.eq('stale', filters.stale)

    query = query.order('updated_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as OpportunityWithRelations[]
  }

  async findStale(): Promise<OpportunityWithRelations[]> {
    return this.findAll({ stale: true })
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const supabase = await createClient()

    const [oppsResult, activitiesResult] = await Promise.all([
      supabase.from('opportunities').select('*'),
      supabase.from('activities').select('*'),
    ])

    if (oppsResult.error)        throw oppsResult.error
    if (activitiesResult.error)  throw activitiesResult.error

    const opps  = oppsResult.data  ?? []
    const acts  = activitiesResult.data ?? []
    const now   = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const openOpps = opps.filter(o => o.etapa !== 'ganado' && o.etapa !== 'perdido')

    const stats: DashboardStats = {
      openCount:        openOpps.length,
      wonCount:         opps.filter(o => o.etapa === 'ganado').length,
      lostCount:        opps.filter(o => o.etapa === 'perdido').length,
      staleCount:       opps.filter(o => o.stale).length,

      totalPipeline:    openOpps.reduce((s, o) => s + Number(o.monto_estimado), 0),

      wonThisMonth:     opps
        .filter(o => o.etapa === 'ganado' && o.updated_at >= monthStart)
        .reduce((s, o) => s + Number(o.monto_final ?? 0), 0),

      weightedForecast: openOpps.reduce(
        (s, o) => s + Number(o.monto_estimado) * (o.probabilidad / 100),
        0
      ),

      pendingActivities: acts.filter(a => a.estatus === 'pendiente').length,
      overdueActivities: acts.filter(
        a => a.estatus === 'pendiente' && new Date(a.fecha) < now
      ).length,
    }

    return stats
  }

  async getExecutiveDashboard(): Promise<ExecutiveDashboard> {
    const supabase = await createClient()

    const [oppsResult, profilesResult] = await Promise.all([
      supabase.from('opportunities').select('etapa, business_unit, monto_estimado, monto_final, probabilidad, owner_id, created_at, updated_at'),
      supabase.from('profiles').select('id, full_name'),
    ])

    if (oppsResult.error)    throw oppsResult.error
    if (profilesResult.error) throw profilesResult.error

    const opps     = oppsResult.data    ?? []
    const profiles = profilesResult.data ?? []
    const profileMap = new Map(profiles.map(p => [p.id, p.full_name]))

    const now        = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

    const wonOpps  = opps.filter(o => o.etapa === 'ganado')
    const openOpps = opps.filter(o => o.etapa !== 'ganado' && o.etapa !== 'perdido')

    // KPIs
    const wonThisMonth  = wonOpps.filter(o => o.updated_at >= monthStart).reduce((s, o) => s + Number(o.monto_final ?? 0), 0)
    const wonLastMonth  = wonOpps.filter(o => o.updated_at >= lastMonthStart && o.updated_at < monthStart).reduce((s, o) => s + Number(o.monto_final ?? 0), 0)
    const pipelineTotal = openOpps.reduce((s, o) => s + Number(o.monto_estimado ?? 0), 0)
    const newThisMonth  = opps.filter(o => o.created_at >= monthStart).length

    // Sales by business unit (only won)
    const unitMap = new Map<BusinessUnit, number>()
    for (const o of wonOpps) {
      const unit = o.business_unit as BusinessUnit
      unitMap.set(unit, (unitMap.get(unit) ?? 0) + Number(o.monto_final ?? 0))
    }
    const salesByUnit: SalesByUnit[] = Array.from(unitMap.entries())
      .map(([unit, amount]) => ({ unit, amount }))
      .filter(x => x.amount > 0)
      .sort((a, b) => b.amount - a.amount)

    // Pipeline by owner (weighted, open opps only)
    const ownerMap = new Map<string, { amount: number; count: number; name: string }>()
    for (const o of openOpps) {
      const name    = profileMap.get(o.owner_id) ?? o.owner_id
      const weighted = Number(o.monto_estimado ?? 0) * ((o.probabilidad ?? 0) / 100)
      const prev    = ownerMap.get(o.owner_id) ?? { amount: 0, count: 0, name }
      ownerMap.set(o.owner_id, { amount: prev.amount + weighted, count: prev.count + 1, name })
    }
    const pipelineByOwner: PipelineByOwner[] = Array.from(ownerMap.values())
      .map(v => ({ ownerName: v.name, amount: v.amount, count: v.count }))
      .sort((a, b) => b.amount - a.amount)

    // Forecast by stage (open opps grouped by etapa)
    const stageMap = new Map<OpportunityStage, { amount: number; weighted: number; count: number }>()
    for (const o of openOpps) {
      const stage    = o.etapa as OpportunityStage
      const amount   = Number(o.monto_estimado ?? 0)
      const weighted = amount * ((o.probabilidad ?? 0) / 100)
      const prev     = stageMap.get(stage) ?? { amount: 0, weighted: 0, count: 0 }
      stageMap.set(stage, { amount: prev.amount + amount, weighted: prev.weighted + weighted, count: prev.count + 1 })
    }

    const STAGE_ORDER: OpportunityStage[] = [
      'nuevo_lead', 'contactado', 'diagnostico', 'cotizacion_enviada',
      'seguimiento', 'negociacion',
    ]
    const forecastByStage: ForecastByStage[] = STAGE_ORDER
      .filter(s => stageMap.has(s))
      .map(stage => ({ stage, ...stageMap.get(stage)! }))

    return {
      kpis: { wonThisMonth, wonLastMonth, pipelineTotal, opportunitiesOpen: openOpps.length, newThisMonth },
      salesByUnit,
      pipelineByOwner,
      forecastByStage,
    }
  }

  async create(data: CreateOpportunityInput): Promise<OpportunityRow> {
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('opportunities')
      .insert(toInsert(data))
      .select()
      .single()

    if (error) throw error
    return created
  }

  async update(id: string, data: UpdateOpportunityInput): Promise<OpportunityRow> {
    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from('opportunities')
      .update(toUpdate(data))
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
