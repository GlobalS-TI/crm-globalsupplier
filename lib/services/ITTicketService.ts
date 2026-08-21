import { IT_TICKET_PRIORITIES, IT_TICKET_SLA_DAYS } from '@/lib/types'
import type { ITTicketStatus, ITTicketPriority } from '@/lib/types'
import {
  createITTicketSchema,
  setITTicketPrioritySchema,
  setITTicketStatusSchema,
  itTicketFileSchema,
  itTicketMessageSchema,
} from '@/lib/validations/itTicket'
import type {
  IITTicketRepository,
  ITTicketRow,
  ITTicketWithRelations,
  ITTicketFileRow,
  ITTicketMessageRow,
  ITTicketFilters,
} from '@/lib/repositories/interfaces/IITTicketRepository'
import type { IProfileRepository } from '@/lib/repositories/interfaces/IProfileRepository'

export type ITTicketKpiByPriority = {
  priority:             ITTicketPriority
  resolved_count:       number
  avg_days_to_resolve:  number | null
  within_sla_pct:       number | null
}

export type ITTicketKpiSummary = {
  by_priority:           ITTicketKpiByPriority[]
  total_resolved:        number
  overall_eficacia_pct:  number | null
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export class ITTicketService {
  constructor(
    private readonly repo:        IITTicketRepository,
    private readonly profileRepo: IProfileRepository,
  ) {}

  async listTickets(filters?: ITTicketFilters): Promise<ITTicketRow[]> {
    return this.repo.list(filters)
  }

  async getTicketById(id: string): Promise<ITTicketWithRelations | null> {
    return this.repo.findById(id)
  }

  async createTicket(raw: unknown, userId: string): Promise<ITTicketRow> {
    const data = createITTicketSchema.parse(raw)
    const assignee = await this.profileRepo.findFirstITStaff()

    const ticket = await this.repo.create({
      title:        data.title,
      description:  data.description ?? null,
      brand:        data.brand,
      priority:     data.priority,
      status:       'abierto',
      requester_id: userId,
      assignee_id:  assignee?.id ?? null,
    })

    await this.repo.addStageLog({
      ticket_id:   ticket.id,
      from_status: null,
      to_status:   'abierto',
      changed_by:  userId,
      comment:     'Ticket creado',
    })

    return ticket
  }

  async setStatus(id: string, raw: unknown, userId: string): Promise<ITTicketRow> {
    const data = setITTicketStatusSchema.parse(raw)
    const ticket = await this.repo.findById(id)
    if (!ticket) throw new Error('Ticket no encontrado')

    if (ticket.status === data.status) {
      throw new Error('El ticket ya está en ese estado.')
    }

    const resolvedAt = data.status === 'resuelto' ? new Date().toISOString() : null

    const updated = await this.repo.updateStatus(id, data.status, resolvedAt)
    await this.repo.addStageLog({
      ticket_id:   id,
      from_status: ticket.status,
      to_status:   data.status,
      changed_by:  userId,
      comment:     data.comment ?? null,
    })

    return updated
  }

  async setStatus(id: string, raw: unknown, userId: string): Promise<ITTicketRow> {
    const data = setITTicketStatusSchema.parse(raw)
    const ticket = await this.repo.findById(id)
    if (!ticket) throw new Error('Ticket no encontrado')

    if (ticket.status === data.status) {
      throw new Error('El ticket ya está en ese estado.')
    }

    const resolvedAt = data.status === 'resuelto' ? new Date().toISOString() : null

    const updated = await this.repo.updateStatus(id, data.status, resolvedAt)
    await this.repo.addStageLog({
      ticket_id:   id,
      from_status: ticket.status,
      to_status:   data.status,
      changed_by:  userId,
      comment:     data.comment ?? null,
    })

    return updated
  }

  async setPriority(id: string, raw: unknown): Promise<ITTicketRow> {
    const data = setITTicketPrioritySchema.parse(raw)
    return this.repo.updatePriority(id, data.priority)
  }

  async addFile(raw: unknown, ownerId: string): Promise<ITTicketFileRow> {
    const data = itTicketFileSchema.parse(raw)
    return this.repo.addFile({
      ticket_id: data.ticket_id,
      nombre:    data.nombre,
      file_path: data.file_path,
      mime_type: data.mime_type ?? null,
      file_size: data.file_size ?? null,
      owner_id:  ownerId,
    })
  }

  async deleteFile(id: string): Promise<void> {
    return this.repo.deleteFile(id)
  }

  async addMessage(ticketId: string, raw: unknown, authorId: string): Promise<ITTicketMessageRow> {
    const data = itTicketMessageSchema.parse(raw)
    return this.repo.addMessage({
      ticket_id:  ticketId,
      content:    data.content,
      file_url:   data.file_url   ?? null,
      file_label: data.file_label ?? null,
      author_id:  authorId,
    })
  }

  async getKpiSummary(): Promise<ITTicketKpiSummary> {
    const rows = await this.repo.listResolvedForKpi()

    const byPriority = new Map<ITTicketPriority, { count: number; totalDays: number; withinSla: number }>()
    for (const p of IT_TICKET_PRIORITIES) byPriority.set(p, { count: 0, totalDays: 0, withinSla: 0 })

    for (const row of rows) {
      const days = (new Date(row.resolved_at).getTime() - new Date(row.created_at).getTime()) / MS_PER_DAY
      const bucket = byPriority.get(row.priority)!
      bucket.count += 1
      bucket.totalDays += days
      if (days <= IT_TICKET_SLA_DAYS[row.priority]) bucket.withinSla += 1
    }

    const by_priority: ITTicketKpiByPriority[] = IT_TICKET_PRIORITIES.map(priority => {
      const b = byPriority.get(priority)!
      return {
        priority,
        resolved_count:      b.count,
        avg_days_to_resolve: b.count > 0 ? b.totalDays / b.count : null,
        within_sla_pct:      b.count > 0 ? (b.withinSla / b.count) * 100 : null,
      }
    })

    const total_resolved = rows.length
    const totalWithinSla = [...byPriority.values()].reduce((sum, b) => sum + b.withinSla, 0)

    return {
      by_priority,
      total_resolved,
      overall_eficacia_pct: total_resolved > 0 ? (totalWithinSla / total_resolved) * 100 : null,
    }
  }
}
