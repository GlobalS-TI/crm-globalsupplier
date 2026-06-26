import type {
  ILeadSectionRepository,
  ILeadRepository,
} from '@/lib/repositories/interfaces/ILeadRepository'
import type { IProfileRepository } from '@/lib/repositories/interfaces/IProfileRepository'
import {
  createLeadSectionSchema,
  updateLeadSectionSchema,
  createLeadSchema,
  updateLeadSchema,
  type CreateLeadSectionInput,
  type UpdateLeadSectionInput,
  type CreateLeadInput,
  type UpdateLeadInput,
  type ImportLeadRow,
} from '@/lib/validations/lead'

export class LeadService {
  constructor(
    private readonly sections: ILeadSectionRepository,
    private readonly leads:    ILeadRepository,
    private readonly profiles: IProfileRepository,
  ) {}

  // ── Sections ────────────────────────────────────────────────────

  listSections()                    { return this.sections.listAll() }
  getSectionById(id: string)        { return this.sections.findById(id) }

  createSection(data: CreateLeadSectionInput, userId: string) {
    return this.sections.create(createLeadSectionSchema.parse(data), userId)
  }

  updateSection(id: string, data: UpdateLeadSectionInput) {
    return this.sections.update(id, updateLeadSectionSchema.parse(data))
  }

  deleteSection(id: string) { return this.sections.delete(id) }

  // ── Leads ────────────────────────────────────────────────────────

  listLeadsBySection(sectionId: string)  { return this.leads.listBySection(sectionId) }
  getLeadById(id: string)               { return this.leads.findById(id) }

  createLead(data: CreateLeadInput, userId: string) {
    return this.leads.create(createLeadSchema.parse(data), userId)
  }

  updateLead(id: string, data: UpdateLeadInput) {
    return this.leads.update(id, updateLeadSchema.parse(data))
  }

  deleteLead(id: string) { return this.leads.delete(id) }

  bulkImportLeads(rows: ImportLeadRow[], sectionId: string, userId: string, responsableId?: string) {
    return this.leads.bulkCreate(rows, sectionId, userId, responsableId)
  }

  async getResponsableId(): Promise<string | undefined> {
    const profile = await this.profiles.findFirstByRole('direccion_comercial')
    return profile?.id
  }
}
