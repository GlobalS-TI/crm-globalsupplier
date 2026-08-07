import { createClient } from '@/lib/supabase/server'
import type { IQuoteRepository, QuoteRow } from '@/lib/repositories/interfaces/IQuoteRepository'
import type { CreateQuoteInput, UpdateQuoteInput } from '@/lib/validations/quote'

export class QuoteRepository implements IQuoteRepository {
  async findById(id: string): Promise<QuoteRow | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data
  }

  async findByOpportunity(opportunityId: string): Promise<QuoteRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('version', { ascending: false })

    if (error) throw error
    return data ?? []
  }

  async create(data: CreateQuoteInput, createdBy: string, version: number): Promise<QuoteRow> {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from('quotes')
      .insert({
        opportunity_id: data.opportunity_id,
        status:         data.status,
        document_url:   data.document_url ?? null,
        external_ref:   data.external_ref ?? null,
        notas:          data.notas ?? null,
        created_by:     createdBy,
        version,
      })
      .select('*')
      .single()

    if (error) throw error
    return row
  }

  async update(id: string, data: UpdateQuoteInput): Promise<QuoteRow> {
    const supabase = await createClient()
    const { data: row, error } = await supabase
      .from('quotes')
      .update({
        ...(data.status       !== undefined && { status: data.status }),
        ...(data.document_url !== undefined && { document_url: data.document_url }),
        ...(data.external_ref !== undefined && { external_ref: data.external_ref }),
        ...(data.notas        !== undefined && { notas: data.notas }),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    return row
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('quotes').delete().eq('id', id)
    if (error) throw error
  }
}
