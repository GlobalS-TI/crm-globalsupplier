import type {
  CreateLeadSectionInput,
  UpdateLeadSectionInput,
  CreateLeadInput,
  UpdateLeadInput,
  ImportLeadRow,
} from '@/lib/validations/lead'

// ----------------------------------------------------------------
// Row types (mirrors DB schema)
// ----------------------------------------------------------------

export type LeadSectionRow = {
  id:          string
  nombre:      string
  descripcion: string | null
  created_by:  string
  created_at:  string
}

export type LeadRow = {
  id:                       string
  section_id:               string
  nombre:                   string
  empresa:                  string | null
  email:                    string | null
  telefono:                 string | null
  requerimientos:           string | null
  requirements_file_path:   string | null
  assigned_to:              string | null
  converted_opportunity_id: string | null
  created_by:               string
  created_at:               string
  updated_at:               string
}

export type LeadWithRelations = LeadRow & {
  assignee: { full_name: string } | null
  section:  { nombre: string }
}

export type LeadSectionWithCount = LeadSectionRow & {
  leads: [{ count: number }]
}

// ----------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------

export interface ILeadSectionRepository {
  listAll(): Promise<LeadSectionWithCount[]>
  findById(id: string): Promise<LeadSectionRow | null>
  create(data: CreateLeadSectionInput, createdBy: string): Promise<LeadSectionRow>
  update(id: string, data: UpdateLeadSectionInput): Promise<LeadSectionRow>
  delete(id: string): Promise<void>
}

export interface ILeadRepository {
  listBySection(sectionId: string): Promise<LeadWithRelations[]>
  findById(id: string): Promise<LeadWithRelations | null>
  create(data: CreateLeadInput, createdBy: string): Promise<LeadRow>
  update(id: string, data: UpdateLeadInput): Promise<LeadRow>
  delete(id: string): Promise<void>
  bulkCreate(rows: ImportLeadRow[], sectionId: string, createdBy: string): Promise<number>
}
