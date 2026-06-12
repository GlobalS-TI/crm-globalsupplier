import { createClient } from '@/lib/supabase/server'
import type {
  IActivityRepository,
  ActivityRow,
  ActivityWithOpportunity,
  GlobalPendingActivity,
} from '@/lib/repositories/interfaces/IActivityRepository'
import type { CreateActivityInput, UpdateActivityInput } from '@/lib/validations/activity'
import type { Database } from '@/lib/types/database'

type ActInsert = Database['public']['Tables']['activities']['Insert']
type ActUpdate = Database['public']['Tables']['activities']['Update']

export class ActivityRepository implements IActivityRepository {
  async findById(id: string): Promise<ActivityRow | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  }

  async findByOpportunity(opportunityId: string): Promise<ActivityRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('fecha', { ascending: false })
    if (error) throw error
    return data ?? []
  }

  async findPendingByUser(userId: string): Promise<ActivityWithOpportunity[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('activities')
      .select('*, opportunity:opportunities(id, nombre)')
      .eq('owner_id', userId)
      .eq('estatus', 'pendiente')
      .order('fecha', { ascending: true })
    if (error) throw error
    return (data ?? []) as ActivityWithOpportunity[]
  }

  async findGlobalPending(): Promise<GlobalPendingActivity[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('activities')
      .select('*, opportunity:opportunities(id, nombre), owner:profiles!owner_id(full_name)')
      .eq('estatus', 'pendiente')
      .order('fecha', { ascending: true })
    if (error) throw error
    return (data ?? []) as GlobalPendingActivity[]
  }

  async create(data: CreateActivityInput & { owner_id: string }): Promise<ActivityRow> {
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('activities')
      .insert(data as unknown as ActInsert)
      .select()
      .single()
    if (error) throw error
    return created
  }

  async update(id: string, data: UpdateActivityInput): Promise<ActivityRow> {
    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from('activities')
      .update(data as unknown as ActUpdate)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated
  }

  async complete(id: string, completedAt: string): Promise<ActivityRow> {
    return this.update(id, { estatus: 'completada', completed_at: completedAt })
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) throw error
  }
}
