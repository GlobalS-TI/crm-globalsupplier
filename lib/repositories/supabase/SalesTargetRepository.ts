import { createClient } from '@/lib/supabase/server'
import { businessDayStartISO, businessMonth } from '@/lib/utils/date'
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
      .select('monto_final_mxn, closed_at')
      .eq('owner_id', vendedorId)
      .eq('etapa', 'ganado')
      .not('monto_final', 'is', null)
      .gte('closed_at', businessDayStartISO(`${year}-01-01`))
      .lt('closed_at', businessDayStartISO(`${year + 1}-01-01`))

    if (error) throw error

    const totals: Record<number, number> = {}
    for (const row of data ?? []) {
      // El filtro gte/lt sobre closed_at ya excluye nulls.
      const m = businessMonth(row.closed_at as string)
      totals[m] = (totals[m] ?? 0) + (row.monto_final_mxn ?? 0)
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
