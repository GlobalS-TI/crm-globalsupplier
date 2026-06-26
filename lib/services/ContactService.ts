import type { IContactRepository, ContactRow, ContactWithCompany } from '@/lib/repositories/interfaces/IContactRepository'
import { createContactSchema, updateContactSchema } from '@/lib/validations/contact'

export class ContactService {
  constructor(private readonly repo: IContactRepository) {}

  async getById(id: string): Promise<ContactRow> {
    const contact = await this.repo.findById(id)
    if (!contact) throw new Error('Contacto no encontrado')
    return contact
  }

  async getByIdWithCompany(id: string): Promise<ContactWithCompany> {
    const contact = await this.repo.findByIdWithCompany(id)
    if (!contact) throw new Error('Contacto no encontrado')
    return contact
  }

  async list(opts?: { search?: string; companyId?: string }): Promise<ContactWithCompany[]> {
    return this.repo.findAll(opts)
  }

  async create(raw: unknown, ownerId: string): Promise<ContactRow> {
    const data = createContactSchema.parse(raw)
    return this.repo.create({ ...data, owner_id: ownerId })
  }

  async update(id: string, raw: unknown): Promise<ContactRow> {
    await this.getById(id)
    const data = updateContactSchema.parse(raw)
    return this.repo.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await this.getById(id)
    await this.repo.delete(id)
  }
}
