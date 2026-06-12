import type { IActivityRepository, ActivityRow, ActivityWithOpportunity, GlobalPendingActivity } from '@/lib/repositories/interfaces/IActivityRepository'
import type { CreateActivityInput, UpdateActivityInput } from '@/lib/validations/activity'
import { createActivitySchema, updateActivitySchema } from '@/lib/validations/activity'

export class ActivityService {
  constructor(private readonly repo: IActivityRepository) {}

  async getByOpportunity(opportunityId: string): Promise<ActivityRow[]> {
    return this.repo.findByOpportunity(opportunityId)
  }

  async getPendingByUser(userId: string): Promise<ActivityWithOpportunity[]> {
    return this.repo.findPendingByUser(userId)
  }

  async getGlobalPending(): Promise<GlobalPendingActivity[]> {
    return this.repo.findGlobalPending()
  }

  async create(raw: CreateActivityInput, ownerId: string): Promise<ActivityRow> {
    const data = createActivitySchema.parse(raw)
    return this.repo.create({ ...data, owner_id: ownerId })
  }

  async update(id: string, raw: UpdateActivityInput): Promise<ActivityRow> {
    const data = updateActivitySchema.parse(raw)
    return this.repo.update(id, data)
  }

  async complete(id: string): Promise<ActivityRow> {
    return this.repo.complete(id, new Date().toISOString())
  }

  async delete(id: string): Promise<void> {
    return this.repo.delete(id)
  }
}
