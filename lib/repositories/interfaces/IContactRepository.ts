import type { Database } from '@/lib/types/database'
import type { CreateContactInput, UpdateContactInput } from '@/lib/validations/contact'

export type ContactRow = Database['public']['Tables']['contacts']['Row']

export type ContactWithCompany = ContactRow & {
  company: { id: string; nombre: string } | null
}

export interface IContactRepository {
  findById(id: string): Promise<ContactRow | null>
  findByIdWithCompany(id: string): Promise<ContactWithCompany | null>
  findAll(opts?: { search?: string; companyId?: string }): Promise<ContactWithCompany[]>
  findByCompany(companyId: string): Promise<ContactRow[]>
  create(data: CreateContactInput & { owner_id: string }): Promise<ContactRow>
  update(id: string, data: UpdateContactInput): Promise<ContactRow>
  delete(id: string): Promise<void>
}
