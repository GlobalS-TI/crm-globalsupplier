import { createClient } from '@/lib/supabase/server'
import type { IComisionesRepository, WonOpportunityRow } from '@/lib/repositories/interfaces/IComisionesRepository'
import type { UpsertOpportunityCostInput } from '@/lib/validations/comisiones'

export class ComisionesRepository implements IComisionesRepository {
  async findWonOpportunities(year: number): Promise<WonOpportunityRow[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('opportunities')
      .select(`
        id,
        nombre,
        monto_final,
        business_unit,
        updated_at,
        company:companies ( nombre ),
        owner:profiles!owner_id ( full_name ),
        opportunity_costs ( costo, notas )
      `)
      .eq('etapa', 'ganado')
      .not('monto_final', 'is', null)
      .gte('updated_at', `${year}-01-01`)
      .lt('updated_at', `${year + 1}-01-01`)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return (data ?? []).map(row => ({
      id:             row.id,
      nombre:         row.nombre,
      monto_final:    row.monto_final ?? 0,
      business_unit:  row.business_unit,
      updated_at:     row.updated_at,
      company_nombre: (row.company as { nombre: string } | null)?.nombre ?? null,
      owner_full_name:(row.owner as { full_name: string } | null)?.full_name ?? null,
      costo:          (row.opportunity_costs as { costo: number } | null)?.costo ?? null,
      notas:          (row.opportunity_costs as { notas: string | null } | null)?.notas ?? null,
    }))
  }

  async upsertCost(data: UpsertOpportunityCostInput, createdBy: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
      .from('opportunity_costs')
      .upsert(
        {
          opportunity_id: data.opportunity_id,
          costo:          data.costo,
          notas:          data.notas ?? null,
          created_by:     createdBy,
          updated_at:     new Date().toISOString(),
        },
        { onConflict: 'opportunity_id' }
      )

    if (error) throw error
  }
}
