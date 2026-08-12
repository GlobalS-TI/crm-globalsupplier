import type { UserRole, BusinessUnit } from '@/lib/types'

export interface ProfileRow {
  id:             string
  email:          string
  full_name:      string
  role:           UserRole
  is_active:      boolean
  created_at:     string
  business_units: BusinessUnit[]
  it_staff:       boolean
}

export interface ProfileTableUpdate {
  full_name?: string
  role?:      UserRole
  is_active?: boolean
  email?:     string
  it_staff?:  boolean
}

export interface IProfileRepository {
  findFirstByRole(role: UserRole): Promise<{ id: string } | null>
  /** Primer perfil activo con acceso de gestión de tickets de TI: role='soporte_ti' o it_staff=true. */
  findFirstITStaff(): Promise<{ id: string } | null>
  findAll(): Promise<ProfileRow[]>
  update(id: string, data: ProfileTableUpdate): Promise<void>
}
