import type { Database } from '@/lib/types/database'
import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/lib/validations/invoice'

export type InvoiceRow = Database['public']['Tables']['invoices']['Row']

export interface IInvoiceRepository {
  findByOrder(orderId: string): Promise<InvoiceRow[]>
  create(data: CreateInvoiceInput, createdBy: string): Promise<InvoiceRow>
  update(id: string, data: UpdateInvoiceInput): Promise<InvoiceRow>
  delete(id: string): Promise<void>
}
