import type { Database } from '@/lib/types/database'
import type { CreateActivityInput, UpdateActivityInput } from '@/lib/validations/activity'

export type ActivityRow = Database['public']['Tables']['activities']['Row']

export type ActivityWithOpportunity = ActivityRow & {
  opportunity: { nombre: string; id: string } | null
}

export interface IActivityRepository {
  findById(id: string): Promise<ActivityRow | null>
  findByOpportunity(opportunityId: string): Promise<ActivityRow[]>
  findPendingByUser(userId: string): Promise<ActivityWithOpportunity[]>
  create(data: CreateActivityInput & { owner_id: string }): Promise<ActivityRow>
  update(id: string, data: UpdateActivityInput): Promise<ActivityRow>
  complete(id: string, completedAt: string): Promise<ActivityRow>
  delete(id: string): Promise<void>
}
