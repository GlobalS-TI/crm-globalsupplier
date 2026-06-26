import { getStatusesForTipo } from '@/lib/types'
import type { ProjectStatus, ProjectTipo } from '@/lib/types'
import {
  createProjectSchema,
  updateProjectSchema,
  briefSchema,
  handoffSchema,
  decisionLogEntrySchema,
  projectFileSchema,
  type CreateProjectInput,
  type UpdateProjectInput,
  type BriefInput,
  type HandoffInput,
  type ProjectFileInput,
} from '@/lib/validations/project'
import type {
  IProjectRepository,
  ProjectRow,
  ProjectWithRelations,
  ProjectBriefRow,
  ProjectHandoffRow,
  ProjectFileRow,
  ProjectFilters,
} from '@/lib/repositories/interfaces/IProjectRepository'

export class ProjectService {
  constructor(private readonly repo: IProjectRepository) {}

  async listProjects(filters?: ProjectFilters): Promise<ProjectRow[]> {
    return this.repo.list(filters)
  }

  async getProjectById(id: string): Promise<ProjectWithRelations | null> {
    return this.repo.findById(id)
  }

  async createProject(raw: unknown, userId: string): Promise<ProjectRow> {
    const data = createProjectSchema.parse(raw)
    const project = await this.repo.create({
      tipo:            data.tipo,
      title:           data.title,
      description:     data.description ?? null,
      brand:           data.brand,
      status:          'INCOMING',
      stakeholder_id:  data.stakeholder_id  ?? null,
      requested_by_id: data.requested_by_id ?? null,
      start_date:      data.start_date      ?? null,
      due_date:        data.due_date        ?? null,
      estimated_hours: data.estimated_hours ?? null,
      created_by:      userId,
    })
    await this.repo.addStageLog({
      project_id:  project.id,
      from_status: null,
      to_status:   'INCOMING',
      changed_by:  userId,
      comment:     'Proyecto creado',
    })
    return project
  }

  async updateProject(id: string, raw: unknown): Promise<ProjectRow> {
    const data = updateProjectSchema.parse(raw)
    return this.repo.update(id, {
      ...(data.title           !== undefined && { title:           data.title }),
      ...(data.description     !== undefined && { description:     data.description ?? null }),
      ...(data.brand           !== undefined && { brand:           data.brand }),
      ...(data.stakeholder_id  !== undefined && { stakeholder_id:  data.stakeholder_id  ?? null }),
      ...(data.requested_by_id !== undefined && { requested_by_id: data.requested_by_id ?? null }),
      ...(data.tipo            !== undefined && { tipo:            data.tipo }),
      ...(data.start_date      !== undefined && { start_date:      data.start_date      ?? null }),
      ...(data.due_date        !== undefined && { due_date:        data.due_date        ?? null }),
      ...(data.estimated_hours !== undefined && { estimated_hours: data.estimated_hours ?? null }),
    })
  }

  async advanceStatus(id: string, userId: string, comment?: string): Promise<ProjectRow> {
    const project = await this.repo.findById(id)
    if (!project) throw new Error('Proyecto no encontrado')

    const tipo     = (project.tipo ?? 'DISENO') as ProjectTipo
    const statuses = getStatusesForTipo(tipo)
    const currentIdx = statuses.indexOf(project.status as ProjectStatus)
    if (currentIdx === statuses.length - 1) {
      throw new Error('El proyecto ya está en el estado final.')
    }
    const nextStatus = statuses[currentIdx + 1]

    // Regla: brief requerido antes de salir de INCOMING (ambos tipos)
    if (project.status === 'INCOMING') {
      const b = project.brief
      if (!b?.what?.trim() || !b?.why?.trim()) {
        throw new Error('Completa el Brief (Qué y Por qué) antes de avanzar.')
      }
    }

    // Regla: handoff completo antes de pasar de DISEÑO a DESARROLLO (solo proyectos DISENO)
    if (tipo === 'DISENO' && project.status === 'DESIGN') {
      const h = project.handoff
      if (
        !h?.component_states    ||
        !h?.breakpoints_defined ||
        !h?.interactions_annotated ||
        !h?.assets_exported     ||
        !h?.naming_convention
      ) {
        throw new Error('El Handoff Checklist debe estar 100% completo antes de pasar a Desarrollo.')
      }
    }

    const updated = await this.repo.update(id, { status: nextStatus })
    await this.repo.addStageLog({
      project_id:  id,
      from_status: project.status as ProjectStatus,
      to_status:   nextStatus,
      changed_by:  userId,
      comment:     comment ?? null,
    })
    return updated
  }

  async saveBrief(projectId: string, raw: unknown): Promise<ProjectBriefRow> {
    const data = briefSchema.parse(raw)
    return this.repo.upsertBrief(projectId, {
      what:             data.what             ?? null,
      why:              data.why              ?? null,
      deadline_real:    data.deadline_real    ?? null,
      deadline_desired: data.deadline_desired ?? null,
      notes:            data.notes            ?? null,
    })
  }

  async saveHandoff(projectId: string, raw: unknown): Promise<ProjectHandoffRow> {
    const data = handoffSchema.parse(raw)
    return this.repo.upsertHandoff(projectId, {
      component_states:       data.component_states,
      component_states_note:  data.component_states_note  ?? null,
      breakpoints_defined:    data.breakpoints_defined,
      breakpoints_note:       data.breakpoints_note        ?? null,
      interactions_annotated: data.interactions_annotated,
      interactions_note:      data.interactions_note       ?? null,
      assets_exported:        data.assets_exported,
      assets_note:            data.assets_note             ?? null,
      naming_convention:      data.naming_convention,
      naming_note:            data.naming_note             ?? null,
    })
  }

  async addDecisionEntry(projectId: string, raw: unknown, authorId: string): Promise<void> {
    const { entry } = decisionLogEntrySchema.parse(raw)
    await this.repo.addDecisionLog({
      project_id: projectId,
      entry,
      author_id:  authorId,
    })
  }

  async addFile(projectId: string, raw: unknown): Promise<ProjectFileRow> {
    const data = projectFileSchema.parse(raw)
    return this.repo.addFile({
      project_id: projectId,
      label:      data.label,
      url:        data.url,
      type:       data.type,
    })
  }

  async deleteFile(id: string): Promise<void> {
    return this.repo.deleteFile(id)
  }
}
