// TODO [deuda]: regenerar tipos Supabase (`supabase gen types`) tras aplicar la migración
// para eliminar los casts `as any` en este archivo.
import { createClient } from '@/lib/supabase/server'
import type {
  IProjectRepository,
  ProjectRow,
  ProjectWithRelations,
  ProjectBriefRow,
  ProjectHandoffRow,
  ProjectStageLogRow,
  ProjectDecisionLogRow,
  ProjectFileRow,
  ProjectFilters,
} from '@/lib/repositories/interfaces/IProjectRepository'

const WITH_RELATIONS = `
  *,
  stakeholder:profiles!stakeholder_id(full_name),
  requested_by:profiles!requested_by_id(full_name),
  creator:profiles!created_by(full_name),
  brief:project_briefs(*),
  handoff:project_handoff_checklists(*),
  stage_logs:project_stage_logs(*, changer:profiles!changed_by(full_name)),
  decision_logs:project_decision_logs(*, author:profiles!author_id(full_name)),
  files:project_files(*)
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export class ProjectRepository implements IProjectRepository {
  async list(filters?: ProjectFilters): Promise<ProjectRow[]> {
    const sb: AnyClient = await createClient()
    let q = sb
      .from('projects')
      .select('*, stakeholder:profiles!stakeholder_id(full_name), requested_by:profiles!requested_by_id(full_name)')
      .order('created_at', { ascending: false })

    if (filters?.brand)  q = q.eq('brand', filters.brand)
    if (filters?.status) q = q.eq('status', filters.status)

    const { data, error } = await q
    if (error) throw error
    return data as ProjectRow[]
  }

  async findById(id: string): Promise<ProjectWithRelations | null> {
    const sb: AnyClient = await createClient()
    const { data, error } = await sb
      .from('projects')
      .select(WITH_RELATIONS)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    const project = data as ProjectWithRelations
    project.stage_logs    = (project.stage_logs    ?? []).sort((a: ProjectStageLogRow, b: ProjectStageLogRow) => a.changed_at.localeCompare(b.changed_at))
    project.decision_logs = (project.decision_logs ?? []).sort((a: ProjectDecisionLogRow, b: ProjectDecisionLogRow) => a.created_at.localeCompare(b.created_at))
    project.files         = (project.files         ?? []).sort((a: ProjectFileRow, b: ProjectFileRow) => b.created_at.localeCompare(a.created_at))
    return project
  }

  async create(data: Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb.from('projects').insert(data).select().single()
    if (error) throw error
    return row as ProjectRow
  }

  async update(id: string, data: Partial<Omit<ProjectRow, 'id' | 'created_at'>>): Promise<ProjectRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb.from('projects').update(data).eq('id', id).select().single()
    if (error) throw error
    return row as ProjectRow
  }

  async upsertBrief(projectId: string, data: Omit<ProjectBriefRow, 'id' | 'project_id' | 'updated_at'>): Promise<ProjectBriefRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb
      .from('project_briefs')
      .upsert({ project_id: projectId, ...data }, { onConflict: 'project_id' })
      .select()
      .single()
    if (error) throw error
    return row as ProjectBriefRow
  }

  async upsertHandoff(projectId: string, data: Omit<ProjectHandoffRow, 'id' | 'project_id' | 'updated_at'>): Promise<ProjectHandoffRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb
      .from('project_handoff_checklists')
      .upsert({ project_id: projectId, ...data }, { onConflict: 'project_id' })
      .select()
      .single()
    if (error) throw error
    return row as ProjectHandoffRow
  }

  async addStageLog(data: Omit<ProjectStageLogRow, 'id' | 'changed_at' | 'changer'>): Promise<void> {
    const sb: AnyClient = await createClient()
    const { error } = await sb.from('project_stage_logs').insert(data)
    if (error) throw error
  }

  async addDecisionLog(data: Omit<ProjectDecisionLogRow, 'id' | 'created_at' | 'author'>): Promise<void> {
    const sb: AnyClient = await createClient()
    const { error } = await sb.from('project_decision_logs').insert(data)
    if (error) throw error
  }

  async addFile(data: Omit<ProjectFileRow, 'id' | 'created_at'>): Promise<ProjectFileRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb.from('project_files').insert(data).select().single()
    if (error) throw error
    return row as ProjectFileRow
  }

  async deleteFile(id: string): Promise<void> {
    const sb: AnyClient = await createClient()
    const { error } = await sb.from('project_files').delete().eq('id', id)
    if (error) throw error
  }
}
