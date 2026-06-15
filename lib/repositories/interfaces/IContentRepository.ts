import type { BusinessUnit } from '@/lib/validations/opportunity'
import type {
  CreateContentCategoryInput,
  UpdateContentCategoryInput,
  CreateContentItemInput,
  UpdateContentItemInput,
  CreateContentFileInput,
} from '@/lib/validations/content'

// ----------------------------------------------------------------
// Row types (mirrors DB schema; regenerate with: pnpm db:types)
// ----------------------------------------------------------------
export type ContentCategoryRow = {
  id:         string
  nombre:     string
  icono:      string | null
  orden:      number
  created_at: string
  updated_at: string
}

export type ContentItemRow = {
  id:            string
  category_id:   string
  business_unit: BusinessUnit
  nombre:        string
  descripcion:   string | null
  owner_id:      string
  created_at:    string
  updated_at:    string
}

export type ContentItemWithRelations = ContentItemRow & {
  category:      { nombre: string; icono: string | null }
  owner:         { full_name: string }
  content_files: [{ count: number }]
}

export type ContentFileRow = {
  id:         string
  item_id:    string
  tipo:       'upload' | 'youtube_url'
  file_path:  string | null
  url:        string | null
  nombre:     string
  mime_type:  string | null
  file_size:  number | null
  owner_id:   string
  created_at: string
}

export type ContentItemFilters = {
  categoryId?:   string
  businessUnit?: BusinessUnit
  query?:        string
}

// ----------------------------------------------------------------
// Interfaces
// ----------------------------------------------------------------
export interface IContentCategoryRepository {
  listAll(): Promise<ContentCategoryRow[]>
  findById(id: string): Promise<ContentCategoryRow | null>
  create(data: CreateContentCategoryInput): Promise<ContentCategoryRow>
  update(id: string, data: UpdateContentCategoryInput): Promise<ContentCategoryRow>
  delete(id: string): Promise<void>
}

export interface IContentItemRepository {
  listAll(filters?: ContentItemFilters): Promise<ContentItemWithRelations[]>
  findById(id: string): Promise<ContentItemWithRelations | null>
  create(data: CreateContentItemInput & { owner_id: string }): Promise<ContentItemRow>
  update(id: string, data: UpdateContentItemInput): Promise<ContentItemRow>
  delete(id: string): Promise<void>
}

export interface IContentFileRepository {
  listByItem(itemId: string): Promise<ContentFileRow[]>
  findById(id: string): Promise<ContentFileRow | null>
  create(data: CreateContentFileInput & { owner_id: string }): Promise<ContentFileRow>
  delete(id: string): Promise<void>
  getSignedUrl(filePath: string, expiresIn?: number): Promise<string>
}
