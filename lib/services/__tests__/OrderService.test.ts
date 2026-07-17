import { OrderService } from '@/lib/services/OrderService'
import type { IOrderRepository, OrderRow } from '@/lib/repositories/interfaces/IOrderRepository'
import type { IQuoteRepository, QuoteRow } from '@/lib/repositories/interfaces/IQuoteRepository'

const OPP_ID   = '00000000-0000-0000-0000-000000000001'
const QUOTE_ID = '00000000-0000-0000-0000-000000000002'
const OTHER_OPP_ID = '00000000-0000-0000-0000-000000000009'

function makeQuoteRow(overrides: Partial<QuoteRow> = {}): QuoteRow {
  return {
    id: QUOTE_ID, opportunity_id: OPP_ID, version: 1, status: 'aceptada',
    document_url: null, external_ref: null, notas: null, created_by: 'user-001',
    created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeOrderRow(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: 'order-001', opportunity_id: OPP_ID, quote_id: QUOTE_ID, version: 1,
    status: 'revision_cliente', document_url: null, external_ref: null, notas: null,
    created_by: 'user-001', created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeMockOrderRepo(overrides: Partial<IOrderRepository> = {}): IOrderRepository {
  return {
    findById:         vi.fn(),
    findByOpportunity: vi.fn().mockResolvedValue([]),
    create:            vi.fn().mockResolvedValue(makeOrderRow()),
    update:            vi.fn(),
    delete:            vi.fn(),
    listProviders:     vi.fn(),
    addProvider:       vi.fn(),
    removeProvider:    vi.fn(),
    ...overrides,
  }
}

function makeMockQuoteRepo(overrides: Partial<IQuoteRepository> = {}): IQuoteRepository {
  return {
    findById:         vi.fn().mockResolvedValue(makeQuoteRow()),
    findByOpportunity: vi.fn(),
    create:            vi.fn(),
    update:            vi.fn(),
    delete:            vi.fn(),
    ...overrides,
  }
}

describe('OrderService.create()', () => {
  it('throws when the quote does not exist', async () => {
    const quoteRepo = makeMockQuoteRepo({ findById: vi.fn().mockResolvedValue(null) })
    const svc = new OrderService(makeMockOrderRepo(), quoteRepo)

    await expect(svc.create({ opportunity_id: OPP_ID, quote_id: QUOTE_ID }, 'user-001'))
      .rejects.toThrow('Quote not found')
  })

  it('rejects a quote that belongs to a different opportunity', async () => {
    const quoteRepo = makeMockQuoteRepo({
      findById: vi.fn().mockResolvedValue(makeQuoteRow({ opportunity_id: OTHER_OPP_ID })),
    })
    const svc = new OrderService(makeMockOrderRepo(), quoteRepo)

    await expect(svc.create({ opportunity_id: OPP_ID, quote_id: QUOTE_ID }, 'user-001'))
      .rejects.toThrow(/does not belong/)
  })

  it('rejects a quote that has not been accepted', async () => {
    const quoteRepo = makeMockQuoteRepo({
      findById: vi.fn().mockResolvedValue(makeQuoteRow({ status: 'enviada' })),
    })
    const svc = new OrderService(makeMockOrderRepo(), quoteRepo)

    await expect(svc.create({ opportunity_id: OPP_ID, quote_id: QUOTE_ID }, 'user-001'))
      .rejects.toThrow(/accepted quote/)
  })

  it('increments the version from the highest existing order', async () => {
    const orderRepo = makeMockOrderRepo({
      findByOpportunity: vi.fn().mockResolvedValue([makeOrderRow({ version: 1 })]),
    })
    const svc = new OrderService(orderRepo, makeMockQuoteRepo())

    await svc.create({ opportunity_id: OPP_ID, quote_id: QUOTE_ID }, 'user-001')

    expect(orderRepo.create).toHaveBeenCalledWith(expect.anything(), 'user-001', 2)
  })
})
