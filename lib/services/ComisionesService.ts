import type { IComisionesRepository, WonOpportunityRow } from '@/lib/repositories/interfaces/IComisionesRepository'
import { upsertOpportunityCostSchema, type UpsertOpportunityCostInput } from '@/lib/validations/comisiones'

export type ComisionRow = WonOpportunityRow & {
  utilidad: number
  margen: number | null
}

export type ComisionesSummary = {
  total_venta: number
  total_costo: number
  utilidad_bruta: number
  margen_promedio: number | null
}

export class ComisionesService {
  constructor(private readonly repo: IComisionesRepository) {}

  async getComisionesData(year: number): Promise<{ rows: ComisionRow[]; summary: ComisionesSummary }> {
    const won = await this.repo.findWonOpportunities(year)

    const rows: ComisionRow[] = won.map(row => {
      const costo     = row.costo ?? 0
      const utilidad  = row.monto_final - costo
      const margen    = row.monto_final > 0 ? (utilidad / row.monto_final) * 100 : null
      return { ...row, utilidad, margen }
    })

    const total_venta  = rows.reduce((s, r) => s + r.monto_final, 0)
    const total_costo  = rows.reduce((s, r) => s + (r.costo ?? 0), 0)
    const utilidad_bruta = total_venta - total_costo
    const margen_promedio = total_venta > 0
      ? (utilidad_bruta / total_venta) * 100
      : null

    return { rows, summary: { total_venta, total_costo, utilidad_bruta, margen_promedio } }
  }

  async saveCosto(raw: UpsertOpportunityCostInput, userId: string): Promise<void> {
    const data = upsertOpportunityCostSchema.parse(raw)
    await this.repo.upsertCost(data, userId)
  }
}
