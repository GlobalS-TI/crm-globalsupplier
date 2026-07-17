import { QuoteService } from '@/lib/services/QuoteService'
import type { IQuoteRepository, QuoteRow } from '@/lib/repositories/interfaces/IQuoteRepository'
import type { IOpportunityRepository, OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'

const OPP_ID = '00000000-0000-0000-0000-000000000001'
const OTHER_OPP_ID = '00000000-0000-0000-0000-000000000002'

const JUNO_OPP = {
  id: OPP_ID, business_unit: 'juno_promotional',
} as OpportunityWithRelations

const OTHER_OPP = {
  id: OTHER_OPP_ID, business_unit: 'thunder_safety',
} as OpportunityWithRelations

function makeQuoteRow(overrides: Partial<QuoteRow> = {}): QuoteRow {
  return {
    id: 'quote-001', opportunity_id: OPP_ID, version: 1, status: 'borrador',
    document_url: null, external_ref: null, notas: null, created_by: 'user-001',
    created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeMockQuoteRepo(overrides: Partial<IQuoteRepository> = {}): IQuoteRepository {
  return {
    findById:         vi.fn(),
    findByOpportunity: vi.fn().mockResolvedValue([]),
    create:            vi.fn().mockResolvedValue(makeQuoteRow()),
    update:            vi.fn().mockResolvedValue(makeQuoteRow()),
    delete:            vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

function makeMockOpportunityRepo(overrides: Partial<IOpportunityRepository> = {}): IOpportunityRepository {
  return {
    findById:            vi.fn().mockResolvedValue(JUNO_OPP),
    findAll:             vi.fn(),
    findStale:           vi.fn(),
    getDashboardStats:   vi.fn(),
    getExecutiveDashboard: vi.fn(),
    create:              vi.fn(),
    update:              vi.fn(),
    delete:              vi.fn(),
    ...overrides,
  }
}

describe('QuoteService.create()', () => {
  it('rejects opportunities that are not juno_promotional', async () => {
    const oppRepo = makeMockOpportunityRepo({ findById: vi.fn().mockResolvedValue(OTHER_OPP) })
    const svc = new QuoteService(makeMockQuoteRepo(), oppRepo)

    await expect(svc.create({ opportunity_id: OTHER_OPP_ID }, 'user-001')).rejects.toThrow(/juno_promotional/)
  })

  it('throws when the opportunity does not exist', async () => {
    const oppRepo = makeMockOpportunityRepo({ findById: vi.fn().mockResolvedValue(null) })
    const svc = new QuoteService(makeMockQuoteRepo(), oppRepo)

    await expect(svc.create({ opportunity_id: OPP_ID }, 'user-001')).rejects.toThrow('Opportunity not found')
  })

  it('creates version 1 when there are no existing quotes', async () => {
    const quoteRepo = makeMockQuoteRepo()
    const svc = new QuoteService(quoteRepo, makeMockOpportunityRepo())

    await svc.create({ opportunity_id: OPP_ID }, 'user-001')

    expect(quoteRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ opportunity_id: OPP_ID }), 'user-001', 1,
    )
  })

  it('increments the version from the highest existing quote', async () => {
    const quoteRepo = makeMockQuoteRepo({
      findByOpportunity: vi.fn().mockResolvedValue([makeQuoteRow({ version: 1 }), makeQuoteRow({ id: 'quote-002', version: 2 })]),
    })
    const svc = new QuoteService(quoteRepo, makeMockOpportunityRepo())

    await svc.create({ opportunity_id: OPP_ID }, 'user-001')

    expect(quoteRepo.create).toHaveBeenCalledWith(expect.anything(), 'user-001', 3)
  })
})
