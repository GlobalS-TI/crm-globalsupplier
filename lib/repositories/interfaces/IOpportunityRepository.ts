import type { Database } from '@/lib/types/database'
import type { CreateOpportunityInput, UpdateOpportunityInput, OpportunityStage, BusinessUnit } from '@/lib/validations/opportunity'

export type OpportunityRow = Database['public']['Tables']['opportunities']['Row']

export type OpportunityWithRelations = OpportunityRow & {
  company: { nombre: string } | null
  contact: { nombre: string; apellido: string | null } | null
  owner:   { full_name: string }
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

export type OpportunityFilters = {
  ownerId?:      string
  businessUnit?: BusinessUnit
  stage?:        OpportunityStage
  stale?:        boolean
}

export interface IOpportunityRepository {
  findById(id: string): Promise<OpportunityWithRelations | null>
  findAll(filters?: OpportunityFilters): Promise<OpportunityWithRelations[]>
  findStale(): Promise<OpportunityWithRelations[]>
  getDashboardStats(): Promise<DashboardStats>
  create(data: CreateOpportunityInput): Promise<OpportunityRow>
  update(id: string, data: UpdateOpportunityInput): Promise<OpportunityRow>
  delete(id: string): Promise<void>
}
