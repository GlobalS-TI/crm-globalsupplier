import {
  createContentFileSchema,
  createContentItemSchema,
  updateContentItemSchema,
  createContentCategorySchema,
  updateContentCategorySchema,
} from '@/lib/validations/content'

// ── createContentFileSchema (con refine youtube_url / upload) ────────

describe('createContentFileSchema — tipo youtube_url', () => {
  const baseYoutube = {
    item_id: '00000000-0000-0000-0000-000000000001',
    tipo: 'youtube_url' as const,
    nombre: 'Demo producto',
    url: 'https://www.youtube.com/watch?v=abc123',
  }

  it('acepta youtube_url con url presente', () => {
    const result = createContentFileSchema.safeParse(baseYoutube)
    expect(result.success).toBe(true)
  })

  it('falla youtube_url sin url (refine rechaza)', () => {
    const { url: _url, ...sinUrl } = baseYoutube
    const result = createContentFileSchema.safeParse(sinUrl)
    expect(result.success).toBe(false)
  })

  it('falla youtube_url si url no tiene formato válido', () => {
    const result = createContentFileSchema.safeParse({ ...baseYoutube, url: 'no-es-url' })
    expect(result.success).toBe(false)
  })

  it('acepta youtube_url con file_path presente también (refine solo exige url)', () => {
    // El refine para youtube_url solo requiere !!url — file_path adicional no rompe
    const result = createContentFileSchema.safeParse({
      ...baseYoutube,
      file_path: 'docs/archivo.pdf',
    })
    expect(result.success).toBe(true)
  })
})

describe('createContentFileSchema — tipo upload', () => {
  const baseUpload = {
    item_id: '00000000-0000-0000-0000-000000000002',
    tipo: 'upload' as const,
    nombre: 'Ficha técnica',
    file_path: 'content/fichas/ficha-tecnica.pdf',
  }

  it('acepta upload con file_path presente', () => {
    const result = createContentFileSchema.safeParse(baseUpload)
    expect(result.success).toBe(true)
  })

  it('falla upload sin file_path (refine rechaza)', () => {
    const { file_path: _fp, ...sinFilePath } = baseUpload
    const result = createContentFileSchema.safeParse(sinFilePath)
    expect(result.success).toBe(false)
  })

  it('acepta upload con metadatos opcionales (mime_type, file_size)', () => {
    const result = createContentFileSchema.safeParse({
      ...baseUpload,
      mime_type: 'application/pdf',
      file_size: 204800,
    })
    expect(result.success).toBe(true)
  })

  it('falla si file_size no es entero positivo', () => {
    const result = createContentFileSchema.safeParse({
      ...baseUpload,
      file_size: -100,
    })
    expect(result.success).toBe(false)
  })
})

describe('createContentFileSchema — casos de fallo comunes', () => {
  it('falla si tipo no pertenece al enum', () => {
    const result = createContentFileSchema.safeParse({
      item_id: '00000000-0000-0000-0000-000000000003',
      tipo: 'link',
      nombre: 'Algo',
    })
    expect(result.success).toBe(false)
  })

  it('falla si item_id no es UUID', () => {
    const result = createContentFileSchema.safeParse({
      item_id: 'no-uuid',
      tipo: 'upload',
      nombre: 'Test',
      file_path: 'docs/test.pdf',
    })
    expect(result.success).toBe(false)
  })

  it('falla si nombre está vacío', () => {
    const result = createContentFileSchema.safeParse({
      item_id: '00000000-0000-0000-0000-000000000004',
      tipo: 'upload',
      nombre: '',
      file_path: 'docs/test.pdf',
    })
    expect(result.success).toBe(false)
  })
})

// ── createContentItemSchema ──────────────────────────────────────────

describe('createContentItemSchema', () => {
  const validItem = {
    category_id: '00000000-0000-0000-0000-000000000010',
    business_unit: 'thunder_safety' as const,
    nombre: 'Catálogo EPP 2025',
  }

  it('acepta un content item válido', () => {
    const result = createContentItemSchema.safeParse(validItem)
    expect(result.success).toBe(true)
  })

  it('acepta con descripcion opcional', () => {
    const result = createContentItemSchema.safeParse({
      ...validItem,
      descripcion: 'Todos los equipos de protección del año.',
    })
    expect(result.success).toBe(true)
  })

  it('falla si category_id está ausente', () => {
    const { category_id: _c, ...sinCategory } = validItem
    const result = createContentItemSchema.safeParse(sinCategory)
    expect(result.success).toBe(false)
  })

  it('falla si category_id no es UUID', () => {
    const result = createContentItemSchema.safeParse({ ...validItem, category_id: 'no-uuid' })
    expect(result.success).toBe(false)
  })

  it('falla si business_unit no pertenece al enum', () => {
    const result = createContentItemSchema.safeParse({ ...validItem, business_unit: 'otra_empresa' })
    expect(result.success).toBe(false)
  })

  it('acepta todas las business_units válidas', () => {
    const units = [
      'global_supplier_mty', 'thunder_safety', 'thunder_led',
      'got_fresh_breath', 'gtx_systems', 'juno_promotional', 'fire_spot',
    ] as const
    for (const unit of units) {
      const result = createContentItemSchema.safeParse({ ...validItem, business_unit: unit })
      expect(result.success).toBe(true)
    }
  })

  it('falla si nombre está vacío', () => {
    const result = createContentItemSchema.safeParse({ ...validItem, nombre: '' })
    expect(result.success).toBe(false)
  })

  it('falla si descripcion supera 2000 caracteres', () => {
    const result = createContentItemSchema.safeParse({
      ...validItem,
      descripcion: 'x'.repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

// ── updateContentItemSchema ──────────────────────────────────────────

describe('updateContentItemSchema', () => {
  it('acepta objeto vacío (todos los campos son opcionales)', () => {
    const result = updateContentItemSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('acepta actualización parcial con solo nombre', () => {
    const result = updateContentItemSchema.safeParse({ nombre: 'Nuevo título' })
    expect(result.success).toBe(true)
  })

  it('no acepta category_id (fue omitido del schema de update)', () => {
    const result = updateContentItemSchema.safeParse({
      category_id: '00000000-0000-0000-0000-000000000010',
      nombre: 'Test',
    })
    // Zod hace strip por defecto — el parse tiene éxito pero category_id es ignorado
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).category_id).toBeUndefined()
    }
  })

  it('no acepta business_unit (fue omitido del schema de update)', () => {
    const result = updateContentItemSchema.safeParse({ business_unit: 'thunder_led' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).business_unit).toBeUndefined()
    }
  })
})

// ── createContentCategorySchema ──────────────────────────────────────

describe('createContentCategorySchema', () => {
  it('acepta una categoría válida con nombre', () => {
    const result = createContentCategorySchema.safeParse({ nombre: 'Fichas técnicas' })
    expect(result.success).toBe(true)
  })

  it('acepta con icono y orden explícito', () => {
    const result = createContentCategorySchema.safeParse({
      nombre: 'Videos',
      icono: 'play-circle',
      orden: 2,
    })
    expect(result.success).toBe(true)
  })

  it('aplica default 0 en orden cuando no se proporciona', () => {
    const result = createContentCategorySchema.safeParse({ nombre: 'Catálogos' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.orden).toBe(0)
    }
  })

  it('falla si nombre está vacío', () => {
    const result = createContentCategorySchema.safeParse({ nombre: '' })
    expect(result.success).toBe(false)
  })

  it('falla si nombre supera 100 caracteres', () => {
    const result = createContentCategorySchema.safeParse({ nombre: 'x'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('falla si orden no es entero', () => {
    const result = createContentCategorySchema.safeParse({ nombre: 'Test', orden: 1.5 })
    expect(result.success).toBe(false)
  })

  it('falla si orden es negativo', () => {
    const result = createContentCategorySchema.safeParse({ nombre: 'Test', orden: -1 })
    expect(result.success).toBe(false)
  })
})

// ── updateContentCategorySchema ──────────────────────────────────────

describe('updateContentCategorySchema', () => {
  it('acepta objeto vacío (todos los campos son opcionales)', () => {
    const result = updateContentCategorySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('acepta actualización parcial con solo icono', () => {
    const result = updateContentCategorySchema.safeParse({ icono: 'folder' })
    expect(result.success).toBe(true)
  })
})
