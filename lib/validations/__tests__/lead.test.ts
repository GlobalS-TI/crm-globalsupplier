import {
  createLeadSchema,
  updateLeadSchema,
  importLeadRowSchema,
} from '@/lib/validations/lead'

// ── createLeadSchema ────────────────────────────────────────────────

describe('createLeadSchema', () => {
  const validBase = {
    section_id: '00000000-0000-0000-0000-000000000001',
    nombre: 'Acme Corp',
  }

  it('acepta un payload mínimo válido (section_id + nombre)', () => {
    const result = createLeadSchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('acepta un payload completo con todos los campos opcionales', () => {
    const result = createLeadSchema.safeParse({
      ...validBase,
      empresa: 'Acme S.A.',
      email: 'contacto@acme.com',
      telefono: '+52 81 1234 5678',
      requerimientos: 'Necesitamos EPP para 50 personas.',
      requirements_file_path: 'docs/reqs.pdf',
      responsable_id: '00000000-0000-0000-0000-000000000002',
      vendedor_id: '00000000-0000-0000-0000-000000000003',
    })
    expect(result.success).toBe(true)
  })

  it('falla si section_id está ausente', () => {
    const result = createLeadSchema.safeParse({ nombre: 'Sin sección' })
    expect(result.success).toBe(false)
  })

  it('falla si section_id no es un UUID válido', () => {
    const result = createLeadSchema.safeParse({ ...validBase, section_id: 'no-es-uuid' })
    expect(result.success).toBe(false)
  })

  it('falla si nombre está vacío', () => {
    const result = createLeadSchema.safeParse({ ...validBase, nombre: '' })
    expect(result.success).toBe(false)
  })

  it('falla si nombre supera 200 caracteres', () => {
    const result = createLeadSchema.safeParse({ ...validBase, nombre: 'x'.repeat(201) })
    expect(result.success).toBe(false)
  })

  it('falla si email no tiene formato válido', () => {
    const result = createLeadSchema.safeParse({ ...validBase, email: 'no-es-email' })
    expect(result.success).toBe(false)
  })

  it('acepta email como string vacío (campo limpiable en formulario)', () => {
    const result = createLeadSchema.safeParse({ ...validBase, email: '' })
    expect(result.success).toBe(true)
  })

  it('falla si responsable_id no es UUID', () => {
    const result = createLeadSchema.safeParse({ ...validBase, responsable_id: 'abc' })
    expect(result.success).toBe(false)
  })

  it('falla si vendedor_id no es UUID', () => {
    const result = createLeadSchema.safeParse({ ...validBase, vendedor_id: 'abc' })
    expect(result.success).toBe(false)
  })
})

// ── updateLeadSchema ────────────────────────────────────────────────

describe('updateLeadSchema', () => {
  it('acepta un objeto vacío (todos los campos son opcionales)', () => {
    const result = updateLeadSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('acepta actualización parcial con solo nombre', () => {
    const result = updateLeadSchema.safeParse({ nombre: 'Nuevo nombre' })
    expect(result.success).toBe(true)
  })

  it('acepta responsable_id como null (desasignar responsable)', () => {
    const result = updateLeadSchema.safeParse({ responsable_id: null })
    expect(result.success).toBe(true)
  })

  it('acepta vendedor_id como null (desasignar vendedor)', () => {
    const result = updateLeadSchema.safeParse({ vendedor_id: null })
    expect(result.success).toBe(true)
  })

  it('acepta responsable_id como UUID válido', () => {
    const result = updateLeadSchema.safeParse({
      responsable_id: '00000000-0000-0000-0000-000000000099',
    })
    expect(result.success).toBe(true)
  })

  it('acepta converted_opportunity_id como UUID válido', () => {
    const result = updateLeadSchema.safeParse({
      converted_opportunity_id: '00000000-0000-0000-0000-000000000010',
    })
    expect(result.success).toBe(true)
  })

  it('falla si converted_opportunity_id no es UUID', () => {
    const result = updateLeadSchema.safeParse({ converted_opportunity_id: 'no-uuid' })
    expect(result.success).toBe(false)
  })

  it('no acepta section_id (fue omitido del schema de update)', () => {
    // section_id no es parte del updateLeadSchema — si se pasa se ignora (Zod strip),
    // pero el parse sigue siendo exitoso (not a failure, just stripped)
    const result = updateLeadSchema.safeParse({
      section_id: '00000000-0000-0000-0000-000000000001',
      nombre: 'Test',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as Record<string, unknown>).section_id).toBeUndefined()
    }
  })
})

// ── importLeadRowSchema ─────────────────────────────────────────────

describe('importLeadRowSchema', () => {
  it('acepta solo nombre (campo mínimo requerido)', () => {
    const result = importLeadRowSchema.safeParse({ nombre: 'Juan Pérez' })
    expect(result.success).toBe(true)
  })

  it('acepta fila completa de importación', () => {
    const result = importLeadRowSchema.safeParse({
      nombre: 'María López',
      empresa: 'Distribuidora Norte',
      email: 'maria@norte.com',
      telefono: '8112345678',
      requerimientos: 'Cascos y chalecos para 20 personas',
    })
    expect(result.success).toBe(true)
  })

  it('falla si nombre está ausente', () => {
    const result = importLeadRowSchema.safeParse({ empresa: 'Sin nombre' })
    expect(result.success).toBe(false)
  })

  it('falla si nombre está vacío', () => {
    const result = importLeadRowSchema.safeParse({ nombre: '' })
    expect(result.success).toBe(false)
  })

  it('falla si email no es válido (cuando se incluye)', () => {
    const result = importLeadRowSchema.safeParse({ nombre: 'Test', email: 'mal-email' })
    expect(result.success).toBe(false)
  })

  it('acepta email vacío en importación (celda vacía del CSV)', () => {
    const result = importLeadRowSchema.safeParse({ nombre: 'Test', email: '' })
    expect(result.success).toBe(true)
  })
})
