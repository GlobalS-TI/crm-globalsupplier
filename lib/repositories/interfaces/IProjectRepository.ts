import type { BusinessUnit, ProjectStatus, ProjectTipo, ProjectFileType } from '@/lib/types'

// ----------------------------------------------------------------
// Row types (espejo del schema de DB)
// ----------------------------------------------------------------
export interface ProjectRow {
  id:              string
  title:           string
  description:     string | null
  tipo:            ProjectTipo
  brand:           BusinessUnit
  status:          ProjectStatus
  is_archived:     boolean
  stakeholder_id:  string | null
  requested_by_id: string | null
  start_date:      string | null
  due_date:        string | null
  estimated_hours: number | null
  created_by:      string | null
  created_at:      string
  updated_at:      string
}

export interface ProjectBriefRow {
  id:               string
  project_id:       string
  what:             string | null
  why:              string | null
  deadline_real:    string | null
  deadline_desired: string | null
  notes:            string | null
  updated_at:       string
}

export interface ProjectStageLogRow {
  id:          string
  project_id:  string
  from_status: ProjectStatus | null
  to_status:   ProjectStatus
  changed_by:  string | null
  comment:     string | null
  changed_at:  string
  changer:     { full_name: string } | null
}

export interface ProjectHandoffRow {
  id:                     string
  project_id:             string
  component_states:       boolean
  component_states_note:  string | null
  breakpoints_defined:    boolean
  breakpoints_note:       string | null
  interactions_annotated: boolean
  interactions_note:      string | null
  assets_exported:        boolean
  assets_note:            string | null
  naming_convention:      boolean
  naming_note:            string | null
  updated_at:             string
}

export interface ProjectDecisionLogRow {
  id:         string
  project_id: string
  entry:      string
  author_id:  string | null
  created_at: string
  author:     { full_name: string } | null
}

export interface ProjectFileRow {
  id:         string
  project_id: string
  label:      string
  url:        string
  type:       ProjectFileType
  created_at: string
}

export interface ProjectUpdateRow {
  id:         string
  project_id: string
  content:    string
  file_url:   string | null
  file_label: string | null
  author_id:  string | null
  created_at: string
  author:     { full_name: string } | null
}

// ----------------------------------------------------------------
// Aggregado completo para la vista de detalle
// ----------------------------------------------------------------
export interface ProjectWithRelations extends ProjectRow {
  stakeholder:   { full_name: string } | null
  requested_by:  { full_name: string } | null
  creator:       { full_name: string } | null
  brief:         ProjectBriefRow | null
  handoff:       ProjectHandoffRow | null
  stage_logs:    ProjectStageLogRow[]
  decision_logs: ProjectDecisionLogRow[]
  files:         ProjectFileRow[]
  updates:       ProjectUpdateRow[]
}

// ----------------------------------------------------------------
// Filters para listado
// ----------------------------------------------------------------
export interface ProjectFilters {
  brand?:      BusinessUnit
  status?:     ProjectStatus
  archived?:   boolean
}

// ----------------------------------------------------------------
// Interface del repositorio
// ----------------------------------------------------------------
export interface IProjectRepository {
  list(filters?: ProjectFilters): Promise<ProjectRow[]>
  findById(id: string): Promise<ProjectWithRelations | null>
  create(data: Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectRow>
  update(id: string, data: Partial<Omit<ProjectRow, 'id' | 'created_at'>>): Promise<ProjectRow>
  delete(id: string): Promise<void>
  archive(id: string): Promise<void>

  upsertBrief(projectId: string, data: Omit<ProjectBriefRow, 'id' | 'project_id' | 'updated_at'>): Promise<ProjectBriefRow>
  upsertHandoff(projectId: string, data: Omit<ProjectHandoffRow, 'id' | 'project_id' | 'updated_at'>): Promise<ProjectHandoffRow>

  addStageLog(data: Omit<ProjectStageLogRow, 'id' | 'changed_at' | 'changer'>): Promise<void>
  addDecisionLog(data: Omit<ProjectDecisionLogRow, 'id' | 'created_at' | 'author'>): Promise<void>

  addFile(data: Omit<ProjectFileRow, 'id' | 'created_at'>): Promise<ProjectFileRow>
  deleteFile(id: string): Promise<void>

  addUpdate(data: Omit<ProjectUpdateRow, 'id' | 'created_at' | 'author'>): Promise<ProjectUpdateRow>
}
