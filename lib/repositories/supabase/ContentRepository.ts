import { createClient } from '@/lib/supabase/server'
import type {
  IContentCategoryRepository,
  IContentItemRepository,
  IContentFileRepository,
  ContentCategoryRow,
  ContentItemRow,
  ContentItemWithRelations,
  ContentFileRow,
  ContentItemFilters,
} from '@/lib/repositories/interfaces/IContentRepository'
import type {
  CreateContentCategoryInput,
  UpdateContentCategoryInput,
  CreateContentItemInput,
  UpdateContentItemInput,
  CreateContentFileInput,
} from '@/lib/validations/content'

const ITEM_WITH_RELATIONS =
  '*, category:content_categories(nombre, icono), owner:profiles!owner_id(full_name), content_files(count)'

// ── Categories ────────────────────────────────────────────────────

export class ContentCategoryRepository implements IContentCategoryRepository {
  async listAll(): Promise<ContentCategoryRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })
    if (error) throw error
    return (data ?? []) as ContentCategoryRow[]
  }

  async findById(id: string): Promise<ContentCategoryRow | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('content_categories')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as ContentCategoryRow | null
  }

  async create(data: CreateContentCategoryInput): Promise<ContentCategoryRow> {
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('content_categories')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return created as ContentCategoryRow
  }

  async update(id: string, data: UpdateContentCategoryInput): Promise<ContentCategoryRow> {
    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from('content_categories')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated as ContentCategoryRow
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('content_categories')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ── Items ─────────────────────────────────────────────────────────

export class ContentItemRepository implements IContentItemRepository {
  async listAll(filters: ContentItemFilters = {}): Promise<ContentItemWithRelations[]> {
    const supabase = await createClient()
    let query = supabase.from('content_items').select(ITEM_WITH_RELATIONS)

    if (filters.categoryId)   query = query.eq('category_id', filters.categoryId)
    if (filters.businessUnit) query = query.eq('business_unit', filters.businessUnit)
    if (filters.query)        query = query.ilike('nombre', `%${filters.query}%`)

    query = query.order('nombre', { ascending: true })

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as ContentItemWithRelations[]
  }

  async findById(id: string): Promise<ContentItemWithRelations | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('content_items')
      .select(ITEM_WITH_RELATIONS)
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as ContentItemWithRelations | null
  }

  async create(data: CreateContentItemInput & { owner_id: string }): Promise<ContentItemRow> {
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('content_items')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return created as ContentItemRow
  }

  async update(id: string, data: UpdateContentItemInput): Promise<ContentItemRow> {
    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from('content_items')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated as ContentItemRow
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('content_items')
      .delete()
      .eq('id', id)
    if (error) throw error
  }
}

// ── Files ─────────────────────────────────────────────────────────

export class ContentFileRepository implements IContentFileRepository {
  async listByItem(itemId: string): Promise<ContentFileRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('content_files')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as ContentFileRow[]
  }

  async findById(id: string): Promise<ContentFileRow | null> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('content_files')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw error
    return data as ContentFileRow | null
  }

  async create(data: CreateContentFileInput & { owner_id: string }): Promise<ContentFileRow> {
    const supabase = await createClient()
    const { data: created, error } = await supabase
      .from('content_files')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return created as ContentFileRow
  }

  async delete(id: string): Promise<void> {
    const supabase = await createClient()

    const file = await this.findById(id)
    if (file?.file_path) {
      // Best-effort: remove from storage. Row is deleted regardless.
      await supabase.storage.from('media').remove([file.file_path])
    }

    const { error } = await supabase
      .from('content_files')
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
