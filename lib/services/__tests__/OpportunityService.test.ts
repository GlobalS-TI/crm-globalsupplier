import { OpportunityService } from '@/lib/services/OpportunityService'
import type { IOpportunityRepository, OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'
import type { OpportunityRow } from '@/lib/repositories/interfaces/IOpportunityRepository'

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const BASE_ROW: OpportunityRow = {
  id:                    'opp-001',
  nombre:                'Test Opp',
  business_unit:         'thunder_safety',
  fuente:                'web',
  owner_id:              '00000000-0000-0000-0000-000000000001',
  company_id:            null,
  contact_id:            null,
  etapa:                 'contactado',
  monto_estimado:        10000,
  monto_final:           null,
  probabilidad:          40,
  fecha_cierre_estimada: null,
  next_activity_at:      '2026-07-01T09:00:00.000Z',
  notas:                 null,
  cotizacion_path:       null,
  orden_compra_path:     null,
  is_stale:              false,
  created_at:            '2026-06-01T00:00:00.000Z',
  updated_at:            '2026-06-01T00:00:00.000Z',
}

const BASE_WITH_RELATIONS: OpportunityWithRelations = {
  ...BASE_ROW,
  company: null,
  contact: null,
  owner:   { full_name: 'Jane Doe' },
}

// ---------------------------------------------------------------------------
// Mock factory — creates a fresh vi.fn() repo for each test
// ---------------------------------------------------------------------------

function makeMockRepo(overrides: Partial<IOpportunityRepository> = {}): IOpportunityRepository {
  return {
    findById:            vi.fn().mockResolvedValue(BASE_WITH_RELATIONS),
    findAll:             vi.fn().mockResolvedValue([]),
    findStale:           vi.fn().mockResolvedValue([]),
    getDashboardStats:   vi.fn(),
    getExecutiveDashboard: vi.fn(),
    create:              vi.fn().mockResolvedValue(BASE_ROW),
    update:              vi.fn().mockResolvedValue(BASE_ROW),
    delete:              vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// create()
// ---------------------------------------------------------------------------

describe('OpportunityService.create()', () => {
  it('creates an opportunity when all required fields are valid', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityService(repo)

    const result = await service.create({
      nombre:           'Nueva Oportunidad',
      business_unit:    'thunder_safety',
      fuente:           'web',
      owner_id:         '00000000-0000-0000-0000-000000000001',
      etapa:            'contactado',
      monto_estimado:   5000,
      probabilidad:     30,
      next_activity_at: '2026-07-01T09:00:00.000Z',
    })

    expect(repo.create).toHaveBeenCalledOnce()
    expect(repo.findById).toHaveBeenCalledWith(BASE_ROW.id)
    expect(result).toEqual(BASE_WITH_RELATIONS)
  })

  it('throws a ZodError when a required field is missing (nombre)', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityService(repo)

    // nombre is required (min 1) — omitting it must cause Zod to throw
    await expect(
      service.create({
        nombre:           '',       // violates z.string().min(1)
        business_unit:    'thunder_safety',
        fuente:           'web',
        owner_id:         '00000000-0000-0000-0000-000000000001',
        next_activity_at: '2026-07-01T09:00:00.000Z',
      } as any),
    ).rejects.toThrow()

    expect(repo.create).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// update()
// ---------------------------------------------------------------------------

describe('OpportunityService.update()', () => {
  it('throws when next_activity_at is explicitly set to null on an open-stage opportunity', async () => {
    // existing opportunity is in 'contactado' (open) — has next_activity_at set.
    //
    // updateOpportunitySchema derives next_activity_at from createOpportunityBase
    // where the field accepts string | undefined but NOT null.  Zod therefore
    // rejects null before the service's own guard can run.  The business rule
    // (no removal on open stages) is still enforced — just via Zod's type check
    // rather than the service message.  Either way, repo.update must never fire.
    const repo    = makeMockRepo()
    const service = new OpportunityService(repo)

    await expect(
      service.update('opp-001', {
        // etapa left as-is (contactado — open)
        next_activity_at: null as any,   // explicit removal — invalid per schema
      }),
    ).rejects.toThrow()   // ZodError: "Expected string, received null"

    expect(repo.update).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// moveToStage() — delegates to stageTransitionSchema + update()
// ---------------------------------------------------------------------------

describe('OpportunityService.moveToStage()', () => {
  it('throws when transitioning to ganado without monto_final > 0', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityService(repo)

    // stageTransitionSchema.refine rejects monto_final === 0 for ganado
    await expect(
      service.moveToStage('opp-001', {
        etapa:             'ganado',
        monto_final:       0,
        cotizacion_path:   'docs/cotizacion.pdf',
        orden_compra_path: 'docs/orden.pdf',
      }),
    ).rejects.toThrow()

    expect(repo.update).not.toHaveBeenCalled()
  })

  it('executes successfully when transitioning to ganado with valid monto_final and both documents', async () => {
    const ganadorRow: OpportunityRow = {
      ...BASE_ROW,
      etapa:             'ganado',
      monto_final:       50000,
      cotizacion_path:   'docs/cotizacion.pdf',
      orden_compra_path: 'docs/orden.pdf',
    }
    const ganadorWithRelations: OpportunityWithRelations = {
      ...ganadorRow,
      company: null,
      contact: null,
      owner:   { full_name: 'Jane Doe' },
    }

    const repo = makeMockRepo({
      update:   vi.fn().mockResolvedValue(ganadorRow),
      findById: vi.fn()
        // first call: getById() inside update() to load existing record
        .mockResolvedValueOnce(BASE_WITH_RELATIONS)
        // second call: reload after update
        .mockResolvedValueOnce(ganadorWithRelations),
    })
    const service = new OpportunityService(repo)

    const result = await service.moveToStage('opp-001', {
      etapa:             'ganado',
      monto_final:       50000,
      cotizacion_path:   'docs/cotizacion.pdf',
      orden_compra_path: 'docs/orden.pdf',
    })

    expect(repo.update).toHaveBeenCalledOnce()
    expect(result.etapa).toBe('ganado')
    expect(result.monto_final).toBe(50000)
    expect(result.cotizacion_path).toBe('docs/cotizacion.pdf')
    expect(result.orden_compra_path).toBe('docs/orden.pdf')
  })
})
