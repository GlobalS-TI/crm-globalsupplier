import type { IQuoteRepository, QuoteRow } from '@/lib/repositories/interfaces/IQuoteRepository'
import type { IOpportunityRepository } from '@/lib/repositories/interfaces/IOpportunityRepository'
import { createQuoteSchema, updateQuoteSchema } from '@/lib/validations/quote'

export class QuoteService {
  constructor(
    private readonly repo: IQuoteRepository,
    private readonly opportunityRepo: IOpportunityRepository,
  ) {}

  async listByOpportunity(opportunityId: string): Promise<QuoteRow[]> {
    return this.repo.findByOpportunity(opportunityId)
  }

  async create(raw: unknown, createdBy: string): Promise<QuoteRow> {
    const data = createQuoteSchema.parse(raw)

    const opportunity = await this.opportunityRepo.findById(data.opportunity_id)
    if (!opportunity) throw new Error('Opportunity not found')
    if (opportunity.business_unit !== 'juno_promotional') {
      throw new Error('Quotes are only available for juno_promotional opportunities')
    }

    const existing = await this.repo.findByOpportunity(data.opportunity_id)
    const nextVersion = existing.length === 0 ? 1 : Math.max(...existing.map(q => q.version)) + 1

    return this.repo.create(data, createdBy, nextVersion)
  }

  async updateStatus(id: string, raw: unknown): Promise<QuoteRow> {
    const data = updateQuoteSchema.parse(raw)
    return this.repo.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id)
  }
}
