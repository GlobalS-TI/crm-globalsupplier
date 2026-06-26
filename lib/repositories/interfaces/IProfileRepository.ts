import type { UserRole } from '@/lib/types'

export interface IProfileRepository {
  findFirstByRole(role: UserRole): Promise<{ id: string } | null>
}
