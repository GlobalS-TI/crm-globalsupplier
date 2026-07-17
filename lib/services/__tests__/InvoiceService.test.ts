import { InvoiceService } from '@/lib/services/InvoiceService'
import type { IInvoiceRepository, InvoiceRow } from '@/lib/repositories/interfaces/IInvoiceRepository'
import type { IOrderRepository, OrderRow } from '@/lib/repositories/interfaces/IOrderRepository'

const ORDER_ID = '00000000-0000-0000-0000-000000000003'

function makeOrderRow(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: ORDER_ID, opportunity_id: '00000000-0000-0000-0000-000000000001', quote_id: '00000000-0000-0000-0000-000000000002', version: 1,
    status: 'aprobado', document_url: null, external_ref: null, notas: null,
    created_by: 'user-001', created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeInvoiceRow(overrides: Partial<InvoiceRow> = {}): InvoiceRow {
  return {
    id: 'inv-001', order_id: ORDER_ID, folio: null, monto: null, document_url: null,
    created_by: 'user-001', created_at: '2026-07-01T00:00:00.000Z', updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeMockInvoiceRepo(overrides: Partial<IInvoiceRepository> = {}): IInvoiceRepository {
  return {
    findByOrder: vi.fn().mockResolvedValue([]),
    create:      vi.fn().mockResolvedValue(makeInvoiceRow()),
    update:      vi.fn(),
    delete:      vi.fn(),
    ...overrides,
  }
}

function makeMockOrderRepo(overrides: Partial<IOrderRepository> = {}): IOrderRepository {
  return {
    findById:         vi.fn().mockResolvedValue(makeOrderRow()),
    findByOpportunity: vi.fn(),
    create:            vi.fn(),
    update:            vi.fn(),
    delete:            vi.fn(),
    listProviders:     vi.fn(),
    addProvider:       vi.fn(),
    removeProvider:    vi.fn(),
    ...overrides,
  }
}

describe('InvoiceService.create()', () => {
  it('throws when the order does not exist', async () => {
    const orderRepo = makeMockOrderRepo({ findById: vi.fn().mockResolvedValue(null) })
    const svc = new InvoiceService(makeMockInvoiceRepo(), orderRepo)

    await expect(svc.create({ order_id: ORDER_ID }, 'user-001')).rejects.toThrow('Order not found')
  })

  it('rejects an order that has not been approved', async () => {
    const orderRepo = makeMockOrderRepo({ findById: vi.fn().mockResolvedValue(makeOrderRow({ status: 'revision_cliente' })) })
    const svc = new InvoiceService(makeMockInvoiceRepo(), orderRepo)

    await expect(svc.create({ order_id: ORDER_ID }, 'user-001')).rejects.toThrow(/approved order/)
  })

  it('creates the invoice for an approved order', async () => {
    const invoiceRepo = makeMockInvoiceRepo()
    const svc = new InvoiceService(invoiceRepo, makeMockOrderRepo())

    await svc.create({ order_id: ORDER_ID, folio: 'F-001' }, 'user-001')

    expect(invoiceRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ order_id: ORDER_ID, folio: 'F-001' }), 'user-001',
    )
  })
})
