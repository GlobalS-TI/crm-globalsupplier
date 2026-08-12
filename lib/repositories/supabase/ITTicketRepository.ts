// TODO [deuda]: regenerar tipos Supabase (`pnpm db:types`) tras aplicar la migración
// para eliminar los casts `as any` en este archivo.
import { createClient } from '@/lib/supabase/server'
import type {
  IITTicketRepository,
  ITTicketRow,
  ITTicketWithRelations,
  ITTicketFileRow,
  ITTicketMessageRow,
  ITTicketStageLogRow,
  ITTicketFilters,
  ITTicketKpiRow,
} from '@/lib/repositories/interfaces/IITTicketRepository'
import type { ITTicketStatus, ITTicketPriority } from '@/lib/types'

const WITH_RELATIONS = `
  *,
  requester:profiles!requester_id(full_name),
  assignee:profiles!assignee_id(full_name),
  files:it_ticket_files(*),
  messages:it_ticket_messages(*, author:profiles!author_id(full_name)),
  stage_logs:it_ticket_stage_logs(*, changer:profiles!changed_by(full_name))
`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any

export class ITTicketRepository implements IITTicketRepository {
  async list(filters?: ITTicketFilters): Promise<ITTicketRow[]> {
    const sb: AnyClient = await createClient()
    let q = sb
      .from('it_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters?.status)      q = q.eq('status', filters.status)
    if (filters?.priority)    q = q.eq('priority', filters.priority)
    if (filters?.brand)       q = q.eq('brand', filters.brand)
    if (filters?.requesterId) q = q.eq('requester_id', filters.requesterId)
    if (filters?.assigneeId)  q = q.eq('assignee_id', filters.assigneeId)

    const { data, error } = await q
    if (error) throw error
    return data as ITTicketRow[]
  }

  async listResolvedForKpi(): Promise<ITTicketKpiRow[]> {
    const sb: AnyClient = await createClient()
    const { data, error } = await sb
      .from('it_tickets')
      .select('priority, created_at, resolved_at')
      .eq('status', 'resuelto')
      .not('resolved_at', 'is', null)
    if (error) throw error
    return data as ITTicketKpiRow[]
  }

  async findById(id: string): Promise<ITTicketWithRelations | null> {
    const sb: AnyClient = await createClient()
    const { data, error } = await sb
      .from('it_tickets')
      .select(WITH_RELATIONS)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }

    const ticket = data as ITTicketWithRelations
    ticket.messages   = (ticket.messages   ?? []).sort((a: ITTicketMessageRow, b: ITTicketMessageRow) => a.created_at.localeCompare(b.created_at))
    ticket.stage_logs = (ticket.stage_logs ?? []).sort((a: ITTicketStageLogRow, b: ITTicketStageLogRow) => a.changed_at.localeCompare(b.changed_at))
    ticket.files      = (ticket.files      ?? []).sort((a: ITTicketFileRow, b: ITTicketFileRow) => b.created_at.localeCompare(a.created_at))
    return ticket
  }

  async create(data: Omit<ITTicketRow, 'id' | 'created_at' | 'updated_at' | 'resolved_at'>): Promise<ITTicketRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb.from('it_tickets').insert(data).select().single()
    if (error) throw error
    return row as ITTicketRow
  }

  async updateStatus(id: string, status: ITTicketStatus, resolvedAt: string | null): Promise<ITTicketRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb
      .from('it_tickets')
      .update({ status, resolved_at: resolvedAt })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as ITTicketRow
  }

  async updatePriority(id: string, priority: ITTicketPriority): Promise<ITTicketRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb
      .from('it_tickets')
      .update({ priority })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return row as ITTicketRow
  }

  async addStageLog(data: Omit<ITTicketStageLogRow, 'id' | 'changed_at' | 'changer'>): Promise<void> {
    const sb: AnyClient = await createClient()
    const { error } = await sb.from('it_ticket_stage_logs').insert(data)
    if (error) throw error
  }

  async addFile(data: Omit<ITTicketFileRow, 'id' | 'created_at'>): Promise<ITTicketFileRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb.from('it_ticket_files').insert(data).select().single()
    if (error) throw error
    return row as ITTicketFileRow
  }

  async deleteFile(id: string): Promise<void> {
    const sb: AnyClient = await createClient()

    const { data: file } = await sb.from('it_ticket_files').select('file_path').eq('id', id).maybeSingle()
    if (file?.file_path) {
      // Best-effort: se borra el objeto de storage. La fila se borra sin importar el resultado.
      await sb.storage.from('media').remove([file.file_path])
    }

    const { error } = await sb.from('it_ticket_files').delete().eq('id', id)
    if (error) throw error
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const sb: AnyClient = await createClient()
    const { data, error } = await sb.storage.from('media').createSignedUrl(filePath, expiresIn)
    if (error) throw error
    return data.signedUrl
  }

  async addMessage(data: Omit<ITTicketMessageRow, 'id' | 'created_at' | 'author'>): Promise<ITTicketMessageRow> {
    const sb: AnyClient = await createClient()
    const { data: row, error } = await sb
      .from('it_ticket_messages')
      .insert(data)
      .select('*, author:profiles!author_id(full_name)')
      .single()
    if (error) throw error
    return row as ITTicketMessageRow
  }
}
