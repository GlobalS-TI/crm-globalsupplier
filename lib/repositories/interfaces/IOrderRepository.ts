import type { Database } from '@/lib/types/database'
import type { CreateOrderInput, UpdateOrderInput, OrderProviderInput } from '@/lib/validations/order'

export type OrderRow         = Database['public']['Tables']['orders']['Row']
export type OrderProviderRow = Database['public']['Tables']['order_providers']['Row']

export interface IOrderRepository {
  findById(id: string): Promise<OrderRow | null>
  findByOpportunity(opportunityId: string): Promise<OrderRow[]>
  create(data: CreateOrderInput, createdBy: string, version: number): Promise<OrderRow>
  update(id: string, data: UpdateOrderInput): Promise<OrderRow>
  delete(id: string): Promise<void>
  listProviders(orderId: string): Promise<OrderProviderRow[]>
  addProvider(data: OrderProviderInput): Promise<OrderProviderRow>
  removeProvider(id: string): Promise<void>
}
