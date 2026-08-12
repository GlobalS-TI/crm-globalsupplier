import type { BusinessUnit, ITTicketPriority, ITTicketStatus } from '@/lib/types'

// ----------------------------------------------------------------
// Row types (espejo del schema de DB)
// ----------------------------------------------------------------
export interface ITTicketRow {
  id:           string
  title:        string
  description:  string | null
  brand:        BusinessUnit
  priority:     ITTicketPriority
  status:       ITTicketStatus
  requester_id: string
  assignee_id:  string | null
  resolved_at:  string | null
  created_at:   string
  updated_at:   string
}

export interface ITTicketFileRow {
  id:         string
  ticket_id:  string
  file_path:  string
  nombre:     string
  mime_type:  string | null
  file_size:  number | null
  owner_id:   string
  created_at: string
}

export interface ITTicketMessageRow {
  id:         string
  ticket_id:  string
  content:    string
  file_url:   string | null
  file_label: string | null
  author_id:  string | null
  created_at: string
  author:     { full_name: string } | null
}

export interface ITTicketStageLogRow {
  id:          string
  ticket_id:   string
  from_status: ITTicketStatus | null
  to_status:   ITTicketStatus
  changed_by:  string | null
  comment:     string | null
  changed_at:  string
  changer:     { full_name: string } | null
}

// ----------------------------------------------------------------
// Aggregado completo para la vista de detalle
// ----------------------------------------------------------------
export interface ITTicketWithRelations extends ITTicketRow {
  requester:  { full_name: string } | null
  assignee:   { full_name: string } | null
  files:      ITTicketFileRow[]
  messages:   ITTicketMessageRow[]
  stage_logs: ITTicketStageLogRow[]
}

// ----------------------------------------------------------------
// Filters para listado
// ----------------------------------------------------------------
export interface ITTicketFilters {
  status?:      ITTicketStatus
  priority?:    ITTicketPriority
  brand?:       BusinessUnit
  requesterId?: string
  assigneeId?:  string
}

// Proyección mínima para el KPI — evita traer relations en una query de reporte.
export interface ITTicketKpiRow {
  priority:    ITTicketPriority
  created_at:  string
  resolved_at: string
}

// ----------------------------------------------------------------
// Interface del repositorio
// ----------------------------------------------------------------
export interface IITTicketRepository {
  list(filters?: ITTicketFilters): Promise<ITTicketRow[]>
  listResolvedForKpi(): Promise<ITTicketKpiRow[]>
  findById(id: string): Promise<ITTicketWithRelations | null>
  create(data: Omit<ITTicketRow, 'id' | 'created_at' | 'updated_at' | 'resolved_at'>): Promise<ITTicketRow>
  updateStatus(id: string, status: ITTicketStatus, resolvedAt: string | null): Promise<ITTicketRow>
  updatePriority(id: string, priority: ITTicketPriority): Promise<ITTicketRow>

  addStageLog(data: Omit<ITTicketStageLogRow, 'id' | 'changed_at' | 'changer'>): Promise<void>

  addFile(data: Omit<ITTicketFileRow, 'id' | 'created_at'>): Promise<ITTicketFileRow>
  deleteFile(id: string): Promise<void>
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>

  addMessage(data: Omit<ITTicketMessageRow, 'id' | 'created_at' | 'author'>): Promise<ITTicketMessageRow>
}
