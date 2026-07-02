import type { UserRole, BusinessUnit } from '@/lib/types'
import type { UpdateProfileInput } from '@/lib/validations/profile'

export interface ProfileRow {
  id:             string
  email:          string
  full_name:      string
  role:           UserRole
  is_active:      boolean
  created_at:     string
  business_units: BusinessUnit[]
}

export interface IProfileRepository {
  findFirstByRole(role: UserRole): Promise<{ id: string } | null>
  findAll(): Promise<ProfileRow[]>
  update(id: string, data: Partial<UpdateProfileInput>): Promise<void>
}
