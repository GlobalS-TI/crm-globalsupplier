import { createClient } from '@/lib/supabase/server'
import type { IProfileRepository } from '@/lib/repositories/interfaces/IProfileRepository'
import type { UserRole } from '@/lib/types'

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
}
