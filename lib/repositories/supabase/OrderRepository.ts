import { createClient } from '@/lib/supabase/server'
import type { IOrderRepository, OrderRow, OrderProviderRow } from '@/lib/repositories/interfaces/IOrderRepository'
import type { CreateOrderInput, UpdateOrderInput, OrderProviderInput } from '@/lib/validations/order'

export class OrderRepository implements IOrderRepository {
  async findById(id: string): Promise<OrderRow | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findByOpportunity(opportunityId: string): Promise<OrderRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('version', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async create(data: CreateOrderInput, createdBy: string, version: number): Promise<OrderRow> {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from('orders')
      .insert({
        opportunity_id: data.opportunity_id,
        quote_id:       data.quote_id,
        status:         data.status,
        document_url:   data.document_url ?? null,
        external_ref:   data.external_ref ?? null,
        notas:          data.notas ?? null,
        created_by:     createdBy,
        version,
      })
      .select('*')
      .single()

    if (error) throw error
    return row
  }

  async update(id: string, data: UpdateOrderInput): Promise<OrderRow> {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from('orders')
      .update({
        ...(data.status       !== undefined && { status: data.status }),
        ...(data.document_url !== undefined && { document_url: data.document_url }),
        ...(data.external_ref !== undefined && { external_ref: data.external_ref }),
        ...(data.notas        !== undefined && { notas: data.notas }),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return row
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('orders').delete().eq('id', id)
    if (error) throw error
  }

  async listProviders(orderId: string): Promise<OrderProviderRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('order_providers')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data ?? []
  }

  async addProvider(data: OrderProviderInput): Promise<OrderProviderRow> {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from('order_providers')
      .insert({
        order_id:  data.order_id,
        proveedor: data.proveedor,
        monto:     data.monto ?? null,
        notas:     data.notas ?? null,
      })
      .select('*')
      .single()

    if (error) throw error
    return row
  }

  async removeProvider(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('order_providers').delete().eq('id', id)
    if (error) throw error
  }
}
