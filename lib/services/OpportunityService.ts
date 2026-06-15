import type { IOpportunityRepository, OpportunityWithRelations, DashboardStats, OpportunityFilters, ExecutiveDashboard } from '@/lib/repositories/interfaces/IOpportunityRepository'
import type { CreateOpportunityInput, UpdateOpportunityInput, StageTransitionInput } from '@/lib/validations/opportunity'
import { createOpportunitySchema, updateOpportunitySchema, stageTransitionSchema } from '@/lib/validations/opportunity'

const CLOSED_STAGES = ['ganado', 'perdido'] as const

export class OpportunityService {
  constructor(private readonly repo: IOpportunityRepository) {}

  async getById(id: string): Promise<OpportunityWithRelations> {
    const opp = await this.repo.findById(id)
    if (!opp) throw new Error('Opportunity not found')
    return opp
  }

  async listPipeline(filters?: OpportunityFilters): Promise<OpportunityWithRelations[]> {
    return this.repo.findAll(filters)
  }

  async listStale(): Promise<OpportunityWithRelations[]> {
    return this.repo.findStale()
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.repo.getDashboardStats()
  }

  async getExecutiveDashboard(): Promise<ExecutiveDashboard> {
    return this.repo.getExecutiveDashboard()
  }

  async create(raw: CreateOpportunityInput): Promise<OpportunityWithRelations> {
    const data = createOpportunitySchema.parse(raw)

    // Rule 2: ganado requires positive monto_final (Zod catches missing; service catches zero)
    if (data.etapa === 'ganado') {
      if (!data.monto_final || data.monto_final <= 0) {
        throw new Error('monto_final must be greater than 0 to mark an opportunity as ganado')
      }
    }

    const created = await this.repo.create(data)
    const full = await this.repo.findById(created.id)
    if (!full) throw new Error('Failed to retrieve created opportunity')
    return full
  }

  async update(id: string, raw: UpdateOpportunityInput): Promise<OpportunityWithRelations> {
    const existing = await this.getById(id)
    const data = updateOpportunitySchema.parse(raw)

    const nextStage = data.etapa ?? existing.etapa
    const nextMonto = data.monto_final !== undefined ? data.monto_final : existing.monto_final

    // Rule 2: cannot save ganado without positive monto_final
    if (nextStage === 'ganado' && (!nextMonto || nextMonto <= 0)) {
      throw new Error('monto_final must be greater than 0 to mark an opportunity as ganado')
    }

    // Rule 3: cannot remove next_activity_at from an open opportunity
    const willBeOpen = !CLOSED_STAGES.includes(nextStage as typeof CLOSED_STAGES[number])
    if (willBeOpen && data.next_activity_at === null) {
      throw new Error('next_activity_at cannot be removed from an open opportunity')
    }

    const updated = await this.repo.update(id, data)
    const full = await this.repo.findById(updated.id)
    if (!full) throw new Error('Failed to retrieve updated opportunity')
    return full
  }

  async moveToStage(id: string, raw: StageTransitionInput): Promise<OpportunityWithRelations> {
    const { etapa, monto_final } = stageTransitionSchema.parse(raw)
    return this.update(id, { etapa, ...(monto_final !== undefined && { monto_final }) })
  }

  async delete(id: string): Promise<void> {
    await this.getById(id) // verify existence and RLS access
    await this.repo.delete(id)
  }
}
