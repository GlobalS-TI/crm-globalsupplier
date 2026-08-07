import type { IOrderRepository, OrderRow, OrderProviderRow } from '@/lib/repositories/interfaces/IOrderRepository'
import type { IQuoteRepository } from '@/lib/repositories/interfaces/IQuoteRepository'
import { createOrderSchema, updateOrderSchema, orderProviderSchema } from '@/lib/validations/order'

export class OrderService {
  constructor(
    private readonly repo: IOrderRepository,
    private readonly quoteRepo: IQuoteRepository,
  ) {}

  async listByOpportunity(opportunityId: string): Promise<OrderRow[]> {
    return this.repo.findByOpportunity(opportunityId)
  }

  async create(raw: unknown, createdBy: string): Promise<OrderRow> {
    const data = createOrderSchema.parse(raw)

    const quote = await this.quoteRepo.findById(data.quote_id)
    if (!quote) throw new Error('Quote not found')
    if (quote.opportunity_id !== data.opportunity_id) {
      throw new Error('Quote does not belong to this opportunity')
    }
    if (quote.status !== 'aceptada') {
      throw new Error('Orders can only be created from an accepted quote')
    }

    const existing = await this.repo.findByOpportunity(data.opportunity_id)
    const nextVersion = existing.length === 0 ? 1 : Math.max(...existing.map(o => o.version)) + 1

    return this.repo.create(data, createdBy, nextVersion)
  }

  async updateStatus(id: string, raw: unknown): Promise<OrderRow> {
    const data = updateOrderSchema.parse(raw)
    return this.repo.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id)
  }

  async listProviders(orderId: string): Promise<OrderProviderRow[]> {
    return this.repo.listProviders(orderId)
  }

  async addProvider(raw: unknown): Promise<OrderProviderRow> {
    const data = orderProviderSchema.parse(raw)
    return this.repo.addProvider(data)
  }

  async removeProvider(id: string): Promise<void> {
    await this.repo.removeProvider(id)
  }
}
