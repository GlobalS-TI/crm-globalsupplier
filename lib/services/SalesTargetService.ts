import type { ISalesTargetRepository, MonthlyTargetData } from '@/lib/repositories/interfaces/ISalesTargetRepository'
import { upsertSalesTargetSchema, type UpsertSalesTargetInput } from '@/lib/validations/salesTarget'

export class SalesTargetService {
  constructor(private readonly repo: ISalesTargetRepository) {}

  async getMonthlyData(vendedorId: string, year: number): Promise<MonthlyTargetData[]> {
    const [targets, actuals] = await Promise.all([
      this.repo.findTargetsByYear(vendedorId, year),
      this.repo.findActualsByYear(vendedorId, year),
    ])

    const targetMap: Record<number, number> = {}
    for (const t of targets) targetMap[t.month] = Number(t.target_amount)

    return Array.from({ length: 12 }, (_, i) => ({
      month:  i + 1,
      target: targetMap[i + 1] ?? 0,
      actual: actuals[i + 1]  ?? 0,
    }))
  }

  async setTarget(raw: UpsertSalesTargetInput, createdBy: string) {
    const data = upsertSalesTargetSchema.parse(raw)
    return this.repo.upsert(data, createdBy)
  }
}
