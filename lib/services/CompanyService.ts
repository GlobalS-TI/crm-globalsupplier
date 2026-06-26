import type { ICompanyRepository, CompanyRow, CompanyWithContacts } from '@/lib/repositories/interfaces/ICompanyRepository'
import { createCompanySchema, updateCompanySchema } from '@/lib/validations/company'

export class CompanyService {
  constructor(private readonly repo: ICompanyRepository) {}

  async getById(id: string): Promise<CompanyRow> {
    const company = await this.repo.findById(id)
    if (!company) throw new Error('Empresa no encontrada')
    return company
  }

  async getByIdWithContacts(id: string): Promise<CompanyWithContacts> {
    const company = await this.repo.findByIdWithContacts(id)
    if (!company) throw new Error('Empresa no encontrada')
    return company
  }

  async list(search?: string): Promise<CompanyRow[]> {
    return this.repo.findAll(search)
  }

  async create(raw: unknown, ownerId: string): Promise<CompanyRow> {
    const data = createCompanySchema.parse(raw)
    return this.repo.create({ ...data, owner_id: ownerId })
  }

  async update(id: string, raw: unknown): Promise<CompanyRow> {
    await this.getById(id)
    const data = updateCompanySchema.parse(raw)
    return this.repo.update(id, data)
  }

  async delete(id: string): Promise<void> {
    await this.getById(id)
    await this.repo.delete(id)
  }
}
