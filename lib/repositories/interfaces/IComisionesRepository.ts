import type { UpsertOpportunityCostInput } from '@/lib/validations/comisiones'
import type { Currency } from '@/lib/validations/opportunity'

export type WonOpportunityRow = {
  id: string
  nombre: string
  monto_final: number
  monto_final_mxn: number
  moneda: Currency
  tipo_cambio_final: number | null
  business_unit: string
  updated_at: string
  company_nombre: string | null
  owner_full_name: string | null
  costo: number | null
  costo_mxn: number | null
  costo_moneda: Currency | null
  notas: string | null
}

export interface IComisionesRepository {
  findWonOpportunities(year: number): Promise<WonOpportunityRow[]>
  upsertCost(data: UpsertOpportunityCostInput, createdBy: string): Promise<void>
}
