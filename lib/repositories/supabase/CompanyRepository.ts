import { createClient } from '@/lib/supabase/server'
import type {
  ICompanyRepository,
  CompanyRow,
  CompanyWithContacts,
} from '@/lib/repositories/interfaces/ICompanyRepository'
import type { CreateCompanyInput, UpdateCompanyInput } from '@/lib/validations/company'
import type { Database } from '@/lib/types/database'

type CompanyInsert = Database['public']['Tables']['companies']['Insert']
type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export class CompanyRepository implements ICompanyRepository {
  async findById(id: string): Promise<CompanyRow | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data
  }

  async findByIdWithContacts(id: string): Promise<CompanyWithContacts | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*, contacts(id, nombre, apellido, puesto, email)')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as CompanyWithContacts | null
  }

  async findAll(search?: string): Promise<CompanyRow[]> {
    const supabase = await createClient()
    let query = supabase.from('companies').select('*').order('nombre', { ascending: true })
    if (search) query = query.ilike('nombre', `%${search}%`)
    const { data, error } = await query
    if (error) throw error
    return data ?? []
  }

  async create(data: CreateCompanyInput & { owner_id: string }): Promise<CompanyRow> {
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('companies')
      .insert(data as unknown as CompanyInsert)
      .select()
      .single()
    if (error) throw error
    return created
  }

  async update(id: string, data: UpdateCompanyInput): Promise<CompanyRow> {
    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from('companies')
      .update(data as unknown as CompanyUpdate)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('companies').delete().eq('id', id)
    if (error) throw error
  }
}
