import type { Database } from '@/lib/types/database'
import type { UpsertSalesTargetInput } from '@/lib/validations/salesTarget'

export type SalesTargetRow = Database['public']['Tables']['sales_targets']['Row']

export type MonthlyTargetData = {
  month:  number
  target: number
  actual: number
}

export interface ISalesTargetRepository {
  findTargetsByYear(vendedorId: string, year: number): Promise<SalesTargetRow[]>
  findActualsByYear(vendedorId: string, year: number): Promise<Record<number, number>>
  upsert(data: UpsertSalesTargetInput, createdBy: string): Promise<SalesTargetRow>
}
