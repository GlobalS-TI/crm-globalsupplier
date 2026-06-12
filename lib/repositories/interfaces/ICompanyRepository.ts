import type { Database } from '@/lib/types/database'
import type { CreateCompanyInput, UpdateCompanyInput } from '@/lib/validations/company'

export type CompanyRow = Database['public']['Tables']['companies']['Row']

export type CompanyWithContacts = CompanyRow & {
  contacts: Array<{ id: string; nombre: string; apellido: string | null; puesto: string | null; email: string | null }>
}

export interface ICompanyRepository {
  findById(id: string): Promise<CompanyRow | null>
  findByIdWithContacts(id: string): Promise<CompanyWithContacts | null>
  findAll(search?: string): Promise<CompanyRow[]>
  create(data: CreateCompanyInput & { owner_id: string }): Promise<CompanyRow>
  update(id: string, data: UpdateCompanyInput): Promise<CompanyRow>
  delete(id: string): Promise<void>
}
