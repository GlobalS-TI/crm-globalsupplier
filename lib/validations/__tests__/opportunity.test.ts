import {
  createOpportunitySchema,
  updateOpportunitySchema,
  stageTransitionSchema,
} from '@/lib/validations/opportunity'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_UUID = '00000000-0000-4000-8000-000000000001'

/** Minimal valid payload for createOpportunitySchema (closed stage so no next_activity_at needed). */
const baseCreate = () => ({
  nombre:        'Proyecto Piloto',
  business_unit: 'global_supplier_mty' as const,
  fuente:        'web' as const,
  owner_id:      VALID_UUID,
  etapa:         'ganado' as const, // closed stage — no next_activity_at required
})

// ---------------------------------------------------------------------------
// createOpportunitySchema
// ---------------------------------------------------------------------------

describe('createOpportunitySchema', () => {
  // 1. Required fields
  describe('required fields', () => {
    it('passes when all required fields are present', () => {
      const result = createOpportunitySchema.safeParse(baseCreate())
      expect(result.success).toBe(true)
    })

    it('fails when nombre is missing', () => {
      const { nombre: _n, ...rest } = baseCreate()
      const result = createOpportunitySchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('fails when business_unit is missing', () => {
      const { business_unit: _b, ...rest } = baseCreate()
      const result = createOpportunitySchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('fails when fuente is missing', () => {
      const { fuente: _f, ...rest } = baseCreate()
      const result = createOpportunitySchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('fails when owner_id is missing', () => {
      const { owner_id: _o, ...rest } = baseCreate()
      const result = createOpportunitySchema.safeParse(rest)
      expect(result.success).toBe(false)
    })

    it('fails when owner_id is not a valid UUID', () => {
      const result = createOpportunitySchema.safeParse({ ...baseCreate(), owner_id: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })
  })

  // 2. Open stages require next_activity_at (superRefine rule)
  describe('superRefine — open stages require next_activity_at', () => {
    const OPEN_STAGES = [
      'nuevo_lead', 'contactado', 'diagnostico',
      'cotizacion_enviada', 'seguimiento', 'negociacion',
    ] as const

    for (const etapa of OPEN_STAGES) {
      it(`fails for open stage '${etapa}' without next_activity_at`, () => {
        const result = createOpportunitySchema.safeParse({ ...baseCreate(), etapa })
        expect(result.success).toBe(false)
        if (!result.success) {
          const paths = result.error.issues.map((i) => i.path.join('.'))
          expect(paths).toContain('next_activity_at')
        }
      })

      it(`passes for open stage '${etapa}' when next_activity_at is provided`, () => {
        const result = createOpportunitySchema.safeParse({
          ...baseCreate(),
          etapa,
          next_activity_at: '2026-07-01T10:00:00.000Z',
        })
        expect(result.success).toBe(true)
      })
    }
  })

  // 3. Closed stages do NOT require next_activity_at
  describe('closed stages — next_activity_at not required', () => {
    it('passes for etapa=ganado without next_activity_at', () => {
      const result = createOpportunitySchema.safeParse({ ...baseCreate(), etapa: 'ganado' })
      expect(result.success).toBe(true)
    })

    it('passes for etapa=perdido without next_activity_at', () => {
      const result = createOpportunitySchema.safeParse({ ...baseCreate(), etapa: 'perdido' })
      expect(result.success).toBe(true)
    })
  })

  // 4. datetime-local preprocessing — converts to ISO 8601
  describe('next_activity_at preprocessing', () => {
    it('converts HH:MM datetime-local string (16 chars) to UTC ISO 8601', () => {
      const result = createOpportunitySchema.safeParse({
        ...baseCreate(),
        etapa: 'contactado',
        next_activity_at: '2026-07-01T10:00',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.next_activity_at).toBe('2026-07-01T10:00:00.000Z')
      }
    })

    it('converts HH:MM:SS datetime-local string (19 chars) to UTC ISO 8601', () => {
      const result = createOpportunitySchema.safeParse({
        ...baseCreate(),
        etapa: 'contactado',
        next_activity_at: '2026-07-01T10:00:30',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.next_activity_at).toBe('2026-07-01T10:00:30.000Z')
      }
    })

    it('passes through a value that is already a full ISO 8601 string', () => {
      const iso = '2026-07-01T10:00:00.000Z'
      const result = createOpportunitySchema.safeParse({
        ...baseCreate(),
        etapa: 'contactado',
        next_activity_at: iso,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.next_activity_at).toBe(iso)
      }
    })
  })
})

// ---------------------------------------------------------------------------
// stageTransitionSchema
// ---------------------------------------------------------------------------

describe('stageTransitionSchema', () => {
  // 5. ganado without monto_final must fail
  it('fails when moving to ganado without monto_final', () => {
    const result = stageTransitionSchema.safeParse({
      etapa:             'ganado',
      cotizacion_path:   '/docs/quote.pdf',
      orden_compra_path: '/docs/po.pdf',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('monto_final')
    }
  })

  // 6. ganado without cotizacion_path must fail
  it('fails when moving to ganado without cotizacion_path', () => {
    const result = stageTransitionSchema.safeParse({
      etapa:             'ganado',
      monto_final:       50000,
      orden_compra_path: '/docs/po.pdf',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('cotizacion_path')
    }
  })

  // 7. ganado without orden_compra_path must fail
  it('fails when moving to ganado without orden_compra_path', () => {
    const result = stageTransitionSchema.safeParse({
      etapa:            'ganado',
      monto_final:      50000,
      cotizacion_path:  '/docs/quote.pdf',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('cotizacion_path')
    }
  })

  // 8. ganado with all required fields must pass
  it('passes when moving to ganado with monto_final, cotizacion_path, and orden_compra_path', () => {
    const result = stageTransitionSchema.safeParse({
      etapa:             'ganado',
      monto_final:       50000,
      cotizacion_path:   '/docs/quote.pdf',
      orden_compra_path: '/docs/po.pdf',
    })
    expect(result.success).toBe(true)
  })

  // 9. perdido without documents must pass
  it('passes when moving to perdido without documents (document rules only apply to ganado)', () => {
    const result = stageTransitionSchema.safeParse({ etapa: 'perdido' })
    expect(result.success).toBe(true)
  })

  it('passes for any open stage without documents', () => {
    const result = stageTransitionSchema.safeParse({ etapa: 'negociacion' })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// updateOpportunitySchema
// ---------------------------------------------------------------------------

describe('updateOpportunitySchema', () => {
  // 10. All fields optional — empty object must pass
  it('passes with an empty object (all fields are optional)', () => {
    const result = updateOpportunitySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('passes with a partial update containing only nombre', () => {
    const result = updateOpportunitySchema.safeParse({ nombre: 'Nuevo nombre' })
    expect(result.success).toBe(true)
  })

  it('passes with a partial update containing only monto_final set to null', () => {
    const result = updateOpportunitySchema.safeParse({ monto_final: null })
    expect(result.success).toBe(true)
  })

  it('passes when cotizacion_path and orden_compra_path are provided without other fields', () => {
    const result = updateOpportunitySchema.safeParse({
      cotizacion_path:   '/docs/quote.pdf',
      orden_compra_path: '/docs/po.pdf',
    })
    expect(result.success).toBe(true)
  })

  it('does NOT accept owner_id (omitted from update schema)', () => {
    // owner_id is stripped via .omit(); passing it should still parse successfully
    // (Zod strips unknown keys by default) — the key point is the schema does not
    // expose owner_id and the resulting data will not contain it.
    const result = updateOpportunitySchema.safeParse({ owner_id: VALID_UUID })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('owner_id' in result.data).toBe(false)
    }
  })
})
