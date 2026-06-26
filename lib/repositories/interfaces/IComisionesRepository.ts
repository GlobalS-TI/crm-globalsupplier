import type { UpsertOpportunityCostInput } from '@/lib/validations/comisiones'

export type WonOpportunityRow = {
  id: string
  nombre: string
  monto_final: number
  business_unit: string
  updated_at: string
  company_nombre: string | null
  owner_full_name: string | null
  costo: number | null
  notas: string | null
}

export interface IComisionesRepository {
  findWonOpportunities(year: number): Promise<WonOpportunityRow[]>
  upsertCost(data: UpsertOpportunityCostInput, createdBy: string): Promise<void>
}
