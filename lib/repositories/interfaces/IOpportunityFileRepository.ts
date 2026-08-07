import type { CreateOpportunityFileInput, OpportunityFileCategoria } from '@/lib/validations/opportunityFile'

// ----------------------------------------------------------------
// Row type (mirrors DB schema; regenerate with: pnpm db:types)
// ----------------------------------------------------------------
export type OpportunityFileRow = {
  id:             string
  opportunity_id: string
  categoria:      OpportunityFileCategoria
  file_path:      string
  nombre:         string
  mime_type:      string | null
  file_size:      number | null
  owner_id:       string
  created_at:     string
}

// ----------------------------------------------------------------
// Interface
// ----------------------------------------------------------------
export interface IOpportunityFileRepository {
  listByOpportunity(opportunityId: string): Promise<OpportunityFileRow[]>
  findById(id: string): Promise<OpportunityFileRow | null>
  create(data: CreateOpportunityFileInput & { owner_id: string }): Promise<OpportunityFileRow>
  delete(id: string): Promise<void>
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>
}
