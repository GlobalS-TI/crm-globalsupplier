import { createClient } from '@/lib/supabase/server'
import type { IProfileRepository, ProfileRow, ProfileTableUpdate } from '@/lib/repositories/interfaces/IProfileRepository'
import type { UserRole, BusinessUnit } from '@/lib/types'

export class ProfileRepository implements IProfileRepository {
  async findFirstByRole(role: UserRole): Promise<{ id: string } | null> {
    const supabase = await createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', role)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    return data ?? null
  }

  async findAll(): Promise<ProfileRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, is_active, created_at, profile_business_units(business_unit)')
      .order('full_name')
    if (error || !data) return []
    return data.map(p => ({
      id:             p.id,
      email:          p.email,
      full_name:      p.full_name,
      role:           p.role as UserRole,
      is_active:      p.is_active,
      created_at:     p.created_at,
      business_units: p.profile_business_units.map(b => b.business_unit as BusinessUnit),
    }))
  }

  async update(id: string, data: ProfileTableUpdate): Promise<void> {
    const supabase = await createClient()
    await supabase.from('profiles').update(data).eq('id', id)
  }
}
