import { createClient } from '@/lib/supabase/server'
import type {
  ILeadSectionRepository,
  ILeadRepository,
  LeadSectionRow,
  LeadSectionWithCount,
  LeadRow,
  LeadWithRelations,
} from '@/lib/repositories/interfaces/ILeadRepository'
import type {
  CreateLeadSectionInput,
  UpdateLeadSectionInput,
  CreateLeadInput,
  UpdateLeadInput,
  ImportLeadRow,
} from '@/lib/validations/lead'

const LEAD_WITH_RELATIONS =
  '*, responsable:profiles!responsable_id(full_name), vendedor:profiles!vendedor_id(full_name), section:lead_sections!section_id(nombre, business_unit, fuente)'

async function db() {
  return createClient()
}

// ── Sections ──────────────────────────────────────────────────────

export class LeadSectionRepository implements ILeadSectionRepository {
  async listAll(): Promise<LeadSectionWithCount[]> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('lead_sections')
      .select('*, leads(count)')
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as LeadSectionWithCount[]
  }

  async findById(id: string): Promise<LeadSectionRow | null> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('lead_sections')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as LeadSectionRow | null
  }

  async create(data: CreateLeadSectionInput, createdBy: string): Promise<LeadSectionRow> {
    const supabase = await db()
    const { data: created, error } = await supabase
      .from('lead_sections')
      .insert({ ...data, created_by: createdBy })
      .select()
      .single()
    if (error) throw error
    return created as LeadSectionRow
  }

  async update(id: string, data: UpdateLeadSectionInput): Promise<LeadSectionRow> {
    const supabase = await db()
    const { data: updated, error } = await supabase
      .from('lead_sections')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated as LeadSectionRow
  }

  async delete(id: string): Promise<void> {
    const supabase = await db()
    const { error } = await supabase
      .from('lead_sections')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ── Leads ─────────────────────────────────────────────────────────

export class LeadRepository implements ILeadRepository {
  async listBySection(sectionId: string): Promise<LeadWithRelations[]> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('leads')
      .select(LEAD_WITH_RELATIONS)
      .eq('section_id', sectionId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as LeadWithRelations[]
  }

  async findById(id: string): Promise<LeadWithRelations | null> {
    const supabase = await db()
    const { data, error } = await supabase
      .from('leads')
      .select(LEAD_WITH_RELATIONS)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as LeadWithRelations | null
  }

  async create(data: CreateLeadInput, createdBy: string): Promise<LeadRow> {
    const supabase = await db()
    const { data: created, error } = await supabase
      .from('leads')
      .insert({
        ...data,
        email:      data.email || null,
        created_by: createdBy,
      })
      .select()
      .single()
    if (error) throw error
    return created as LeadRow
  }

  async update(id: string, data: UpdateLeadInput): Promise<LeadRow> {
    const supabase = await db()
    const payload = { ...data, email: data.email || null }
    const { data: updated, error } = await supabase
      .from('leads')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated as LeadRow
  }

  async delete(id: string): Promise<void> {
    const supabase = await db()
    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error
  }

  async bulkCreate(rows: ImportLeadRow[], sectionId: string, createdBy: string, responsableId?: string): Promise<number> {
    if (rows.length === 0) return 0
    const supabase = await db()
    const payload = rows.map(r => ({
      ...r,
      section_id:     sectionId,
      created_by:     createdBy,
      email:          r.email || null,
      responsable_id: responsableId ?? null,
    }))
    const { data, error } = await supabase
      .from('leads')
      .insert(payload)
      .select('id')
    if (error) throw error
    return (data as { id: string }[])?.length ?? 0
  }
}
