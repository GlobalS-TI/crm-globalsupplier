import type { IInvoiceRepository, InvoiceRow } from '@/lib/repositories/interfaces/IInvoiceRepository'
import type { IOrderRepository } from '@/lib/repositories/interfaces/IOrderRepository'
import { createInvoiceSchema, updateInvoiceSchema } from '@/lib/validations/invoice'

export class InvoiceService {
  constructor(
    private readonly repo: IInvoiceRepository,
    private readonly orderRepo: IOrderRepository,
  ) {}

  async listByOrder(orderId: string): Promise<InvoiceRow[]> {
    return this.repo.findByOrder(orderId)
  }

  async create(raw: unknown, createdBy: string): Promise<InvoiceRow> {
    const data = createInvoiceSchema.parse(raw)

    const order = await this.orderRepo.findById(data.order_id)
    if (!order) throw new Error('Order not found')
    if (order.status !== 'aprobado') {
      throw new Error('Invoices can only be created for an approved order')
    }

    return this.repo.create(data, createdBy)
  }

  async update(id: string, raw: unknown): Promise<InvoiceRow> {
    const data = updateInvoiceSchema.parse(raw)
    return this.repo.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id)
  }
}
