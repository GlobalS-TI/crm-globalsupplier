import type {
  ILeadSectionRepository,
  ILeadRepository,
} from '@/lib/repositories/interfaces/ILeadRepository'
import type {
  CreateLeadSectionInput,
  UpdateLeadSectionInput,
  CreateLeadInput,
  UpdateLeadInput,
  ImportLeadRow,
} from '@/lib/validations/lead'

export class LeadService {
  constructor(
    private readonly sections: ILeadSectionRepository,
    private readonly leads:    ILeadRepository,
  ) {}

  // ── Sections ────────────────────────────────────────────────────

  listSections()                    { return this.sections.listAll() }
  getSectionById(id: string)        { return this.sections.findById(id) }

  createSection(data: CreateLeadSectionInput, userId: string) {
    return this.sections.create(data, userId)
  }

  updateSection(id: string, data: UpdateLeadSectionInput) {
    return this.sections.update(id, data)
  }

  deleteSection(id: string) { return this.sections.delete(id) }

  // ── Leads ────────────────────────────────────────────────────────

  listLeadsBySection(sectionId: string)  { return this.leads.listBySection(sectionId) }
  getLeadById(id: string)               { return this.leads.findById(id) }

  createLead(data: CreateLeadInput, userId: string) {
    return this.leads.create(data, userId)
  }

  updateLead(id: string, data: UpdateLeadInput) {
    return this.leads.update(id, data)
  }

  deleteLead(id: string) { return this.leads.delete(id) }

  bulkImportLeads(rows: ImportLeadRow[], sectionId: string, userId: string) {
    return this.leads.bulkCreate(rows, sectionId, userId)
  }
}
