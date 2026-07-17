import { createClient } from '@/lib/supabase/server'
import type { IInvoiceRepository, InvoiceRow } from '@/lib/repositories/interfaces/IInvoiceRepository'
import type { CreateInvoiceInput, UpdateInvoiceInput } from '@/lib/validations/invoice'

export class InvoiceRepository implements IInvoiceRepository {
  async findByOrder(orderId: string): Promise<InvoiceRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async create(data: CreateInvoiceInput, createdBy: string): Promise<InvoiceRow> {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from('invoices')
      .insert({
        order_id:     data.order_id,
        folio:        data.folio ?? null,
        monto:        data.monto ?? null,
        document_url: data.document_url ?? null,
        created_by:   createdBy,
      })
      .select('*')
      .single()

    if (error) throw error
    return row
  }

  async update(id: string, data: UpdateInvoiceInput): Promise<InvoiceRow> {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from('invoices')
      .update({
        ...(data.folio        !== undefined && { folio: data.folio }),
        ...(data.monto        !== undefined && { monto: data.monto }),
        ...(data.document_url !== undefined && { document_url: data.document_url }),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return row
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  }
}
