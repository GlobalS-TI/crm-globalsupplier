import { createClient } from '@/lib/supabase/server'
import type { ISalesTargetRepository, SalesTargetRow } from '@/lib/repositories/interfaces/ISalesTargetRepository'
import type { UpsertSalesTargetInput } from '@/lib/validations/salesTarget'

export class SalesTargetRepository implements ISalesTargetRepository {
  async findTargetsByYear(vendedorId: string, year: number): Promise<SalesTargetRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('sales_targets')
      .select('*')
      .eq('vendedor_id', vendedorId)
      .eq('year', year)
      .order('month')

    if (error) throw error
    return data ?? []
  }

  async findActualsByYear(vendedorId: string, year: number): Promise<Record<number, number>> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('opportunities')
      .select('monto_final, updated_at')
      .eq('owner_id', vendedorId)
      .eq('etapa', 'ganado')
      .not('monto_final', 'is', null)
      .gte('updated_at', `${year}-01-01`)
      .lt('updated_at', `${year + 1}-01-01`)

    if (error) throw error

    const totals: Record<number, number> = {}
    for (const row of data ?? []) {
      const m = new Date(row.updated_at).getMonth() + 1
      totals[m] = (totals[m] ?? 0) + (row.monto_final ?? 0)
    }
    return totals
  }

  async upsert(data: UpsertSalesTargetInput, createdBy: string): Promise<SalesTargetRow> {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from('sales_targets')
      .upsert(
        { ...data, created_by: createdBy },
        { onConflict: 'vendedor_id,year,month' }
      )
      .select()
      .single()

    if (error) throw error
    return row
  }
}
