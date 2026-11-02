import type { Database } from '@/lib/types/database'
import type { CreateOpportunityInput, UpdateOpportunityInput, OpportunityStage, BusinessUnit } from '@/lib/validations/opportunity'

export type OpportunityRow = Database['public']['Tables']['opportunities']['Row']

export type OpportunityWithRelations = OpportunityRow & {
  company: { nombre: string } | null
  contact: { nombre: string; apellido: string | null; email: string | null; telefono: string | null } | null
  owner:   { full_name: string } | null
}

// Lo mínimo que necesita una fila de Reportes (toReportRow). Lo cumplen tanto las
// oportunidades de la app como las que devuelve la lectura de análisis de integraciones.
export type ReportSourceOpportunity = Pick<OpportunityRow,
  | 'id' | 'nombre' | 'business_unit' | 'owner_id' | 'etapa' | 'probabilidad' | 'fuente'
  | 'monto_estimado' | 'moneda' | 'monto_estimado_mxn' | 'monto_final_mxn'
  | 'created_at' | 'last_completed_activity_at' | 'next_activity_at' | 'closed_at' | 'stale'
> & {
  company: { nombre: string } | null
  contact: { nombre: string; apellido: string | null; email: string | null; telefono: string | null } | null
  owner:   { full_name: string } | null
}

export type DashboardStats = {
  openCount:          number
  wonCount:           number
  lostCount:          number
  staleCount:         number
  totalPipeline:      number
  wonThisMonth:       number
  weightedForecast:   number
  pendingActivities:  number
  overdueActivities:  number
}

export type SalesByUnit = {
  unit:   BusinessUnit
  amount: number
}

export type PipelineByOwner = {
  ownerName: string
  amount:    number
  count:     number
}

export type ForecastByStage = {
  stage:    OpportunityStage
  amount:   number
  weighted: number
  count:    number
}

export type ExecutiveDashboard = {
  kpis: {
    wonThisMonth:     number
    wonLastMonth:     number
    pipelineTotal:    number
    pipelineTotalUSD: number
    opportunitiesOpen: number
    newThisMonth:     number
  }
  salesByUnit:     SalesByUnit[]
  pipelineByOwner: PipelineByOwner[]
  forecastByStage: ForecastByStage[]
}

export type OpportunityFilters = {
  ownerId?:      string
  businessUnit?: BusinessUnit
  stage?:        OpportunityStage
  stale?:        boolean
  stages?:              OpportunityStage[]  // etapa IN (…)
  createdFrom?:         string              // ISO, inclusivo
  createdBefore?:       string              // ISO, exclusivo
  closedFrom?:          string              // closed_at ISO, inclusivo
  closedBefore?:        string              // closed_at ISO, exclusivo
  nextActivityMissing?: boolean             // next_activity_at IS NULL
  nextActivityBefore?:  string              // next_activity_at < ISO
}

export interface IOpportunityRepository {
  findById(id: string): Promise<OpportunityWithRelations | null>
  findAll(filters?: OpportunityFilters): Promise<OpportunityWithRelations[]>
  findStale(): Promise<OpportunityWithRelations[]>
  getDashboardStats(): Promise<DashboardStats>
  getExecutiveDashboard(): Promise<ExecutiveDashboard>
  create(data: CreateOpportunityInput): Promise<OpportunityRow>
  update(id: string, data: UpdateOpportunityInput): Promise<OpportunityRow>
  delete(id: string): Promise<void>
}
