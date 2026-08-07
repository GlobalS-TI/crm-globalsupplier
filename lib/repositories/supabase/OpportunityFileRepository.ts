import { createClient } from '@/lib/supabase/server'
import type {
  IOpportunityFileRepository,
  OpportunityFileRow,
} from '@/lib/repositories/interfaces/IOpportunityFileRepository'
import type { CreateOpportunityFileInput } from '@/lib/validations/opportunityFile'

export class OpportunityFileRepository implements IOpportunityFileRepository {
  async listByOpportunity(opportunityId: string): Promise<OpportunityFileRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('opportunity_files')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as OpportunityFileRow[]
  }

  async findById(id: string): Promise<OpportunityFileRow | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('opportunity_files')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as OpportunityFileRow | null
  }

  async create(data: CreateOpportunityFileInput & { owner_id: string }): Promise<OpportunityFileRow> {
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('opportunity_files')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return created as OpportunityFileRow
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()

    const file = await this.findById(id)
    if (file?.file_path) {
      // Best-effort: remove from storage. Row is deleted regardless.
      await supabase.storage.from('media').remove([file.file_path])
    }

    const { error } = await supabase
      .from('opportunity_files')
      .delete()
      .eq('id', id)
    if (error) throw error
  }

  async getSignedUrl(filePath: string, expiresIn = 3600): Promise<string> {
    const supabase = await createClient()
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUrl(filePath, expiresIn)
    if (error) throw error
    return data.signedUrl
  }
}
