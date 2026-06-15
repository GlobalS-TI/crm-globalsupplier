import type {
  IContentCategoryRepository,
  IContentItemRepository,
  IContentFileRepository,
  ContentCategoryRow,
  ContentItemWithRelations,
  ContentFileRow,
  ContentItemFilters,
} from '@/lib/repositories/interfaces/IContentRepository'
import {
  createContentCategorySchema,
  updateContentCategorySchema,
  createContentItemSchema,
  updateContentItemSchema,
  createContentFileSchema,
} from '@/lib/validations/content'
import type {
  CreateContentCategoryInput,
  UpdateContentCategoryInput,
  CreateContentItemInput,
  UpdateContentItemInput,
  CreateContentFileInput,
} from '@/lib/validations/content'

export class ContentService {
  constructor(
    private readonly categories: IContentCategoryRepository,
    private readonly items:      IContentItemRepository,
    private readonly files:      IContentFileRepository,
  ) {}

  // ── Categories ────────────────────────────────────────────────

  listCategories(): Promise<ContentCategoryRow[]> {
    return this.categories.listAll()
  }

  async getCategoryById(id: string): Promise<ContentCategoryRow> {
    const cat = await this.categories.findById(id)
    if (!cat) throw new Error('Categoría no encontrada')
    return cat
  }

  async createCategory(raw: CreateContentCategoryInput): Promise<ContentCategoryRow> {
    const data = createContentCategorySchema.parse(raw)
    return this.categories.create(data)
  }

  async updateCategory(id: string, raw: UpdateContentCategoryInput): Promise<ContentCategoryRow> {
    await this.getCategoryById(id)
    const data = updateContentCategorySchema.parse(raw)
    return this.categories.update(id, data)
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id)
    return this.categories.delete(id)
  }

  // ── Items ─────────────────────────────────────────────────────

  listItems(filters?: ContentItemFilters): Promise<ContentItemWithRelations[]> {
    return this.items.listAll(filters)
  }

  async getItemById(id: string): Promise<ContentItemWithRelations> {
    const item = await this.items.findById(id)
    if (!item) throw new Error('Elemento no encontrado')
    return item
  }

  async createItem(raw: CreateContentItemInput, ownerId: string): Promise<ContentItemWithRelations> {
    const data = createContentItemSchema.parse(raw)
    const created = await this.items.create({ ...data, owner_id: ownerId })
    const full = await this.items.findById(created.id)
    if (!full) throw new Error('Error al recuperar el elemento creado')
    return full
  }

  async updateItem(id: string, raw: UpdateContentItemInput): Promise<ContentItemWithRelations> {
    await this.getItemById(id)
    const data = updateContentItemSchema.parse(raw)
    const updated = await this.items.update(id, data)
    const full = await this.items.findById(updated.id)
    if (!full) throw new Error('Error al recuperar el elemento actualizado')
    return full
  }

  async deleteItem(id: string): Promise<void> {
    await this.getItemById(id)
    return this.items.delete(id)
  }

  // ── Files ─────────────────────────────────────────────────────

  listFiles(itemId: string): Promise<ContentFileRow[]> {
    return this.files.listByItem(itemId)
  }

  async addFile(raw: CreateContentFileInput, ownerId: string): Promise<ContentFileRow> {
    const data = createContentFileSchema.parse(raw)
    return this.files.create({ ...data, owner_id: ownerId })
  }

  async deleteFile(id: string): Promise<void> {
    const file = await this.files.findById(id)
    if (!file) throw new Error('Archivo no encontrado')
    return this.files.delete(id)
  }

  getSignedUrl(filePath: string, expiresIn?: number): Promise<string> {
    return this.files.getSignedUrl(filePath, expiresIn)
  }
}
