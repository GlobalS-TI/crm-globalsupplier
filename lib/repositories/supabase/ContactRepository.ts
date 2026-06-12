import { createClient } from '@/lib/supabase/server'
import type {
  IContactRepository,
  ContactRow,
  ContactWithCompany,
} from '@/lib/repositories/interfaces/IContactRepository'
import type { CreateContactInput, UpdateContactInput } from '@/lib/validations/contact'
import type { Database } from '@/lib/types/database'

type ContactInsert = Database['public']['Tables']['contacts']['Insert']
type ContactUpdate = Database['public']['Tables']['contacts']['Update']

const WITH_COMPANY = '*, company:companies(id, nombre)'

export class ContactRepository implements IContactRepository {
  async findById(id: string): Promise<ContactRow | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  }

  async findByIdWithCompany(id: string): Promise<ContactWithCompany | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contacts')
      .select(WITH_COMPANY)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as ContactWithCompany | null
  }

  async findAll(opts: { search?: string; companyId?: string } = {}): Promise<ContactWithCompany[]> {
    const supabase = await createClient()
    let query = supabase.from('contacts').select(WITH_COMPANY).order('nombre', { ascending: true })
    if (opts.search)    query = query.ilike('nombre', `%${opts.search}%`)
    if (opts.companyId) query = query.eq('company_id', opts.companyId)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as ContactWithCompany[]
  }

  async findByCompany(companyId: string): Promise<ContactRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('company_id', companyId)
      .order('nombre', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async create(data: CreateContactInput & { owner_id: string }): Promise<ContactRow> {
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('contacts')
      .insert(data as unknown as ContactInsert)
      .select()
      .single()
    if (error) throw error
    return created
  }

  async update(id: string, data: UpdateContactInput): Promise<ContactRow> {
    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from('contacts')
      .update(data as unknown as ContactUpdate)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) throw error
  }
}
