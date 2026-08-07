import { ComisionesService } from '@/lib/services/ComisionesService'
import type { IComisionesRepository, WonOpportunityRow } from '@/lib/repositories/interfaces/IComisionesRepository'

function makeMockRepo(overrides: Partial<IComisionesRepository> = {}): IComisionesRepository {
  return {
    findWonOpportunities: vi.fn().mockResolvedValue([]),
    upsertCost:            vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const MXN_ROW: WonOpportunityRow = {
  id:                'opp-mxn',
  nombre:            'Venta MXN',
  monto_final:       100000,
  monto_final_mxn:   100000,
  moneda:            'MXN',
  tipo_cambio_final: null,
  business_unit:     'thunder_safety',
  updated_at:        '2026-03-01T00:00:00.000Z',
  company_nombre:    null,
  owner_full_name:   'Jane Doe',
  costo:             40000,
  costo_mxn:         40000,
  costo_moneda:      'MXN',
  notas:             null,
}

const USD_ROW: WonOpportunityRow = {
  id:                'opp-usd',
  nombre:            'Venta USD',
  monto_final:       5000,
  monto_final_mxn:   92500,          // 5000 * 18.5
  moneda:            'USD',
  tipo_cambio_final: 18.5,
  business_unit:     'gtx_systems',
  updated_at:        '2026-03-15T00:00:00.000Z',
  company_nombre:    null,
  owner_full_name:   'John Roe',
  costo:             1000,
  costo_mxn:         18500,          // 1000 * 18.5
  costo_moneda:      'USD',
  notas:             null,
}

describe('ComisionesService.getComisionesData()', () => {
  it('sums a mixed MXN + USD row set entirely in MXN-equivalent', async () => {
    const repo    = makeMockRepo({ findWonOpportunities: vi.fn().mockResolvedValue([MXN_ROW, USD_ROW]) })
    const service = new ComisionesService(repo)

    const { rows, summary } = await service.getComisionesData(2026)

    // Per-row utilidad/margen use the MXN-equivalent columns, not the raw captured amounts
    expect(rows[0].utilidad).toBe(60000)   // 100000 - 40000
    expect(rows[1].utilidad).toBe(74000)   // 92500 - 18500

    expect(summary.total_venta).toBe(192500)     // 100000 + 92500
    expect(summary.total_costo).toBe(58500)      // 40000 + 18500
    expect(summary.utilidad_bruta).toBe(134000)  // 192500 - 58500
    expect(summary.margen_promedio).toBeCloseTo((134000 / 192500) * 100, 5)
  })

  it('treats a missing cost as zero without affecting the MXN totals', async () => {
    const noCostRow: WonOpportunityRow = { ...USD_ROW, costo: null, costo_mxn: null, costo_moneda: null }
    const repo    = makeMockRepo({ findWonOpportunities: vi.fn().mockResolvedValue([noCostRow]) })
    const service = new ComisionesService(repo)

    const { rows, summary } = await service.getComisionesData(2026)

    expect(rows[0].utilidad).toBe(92500)
    expect(summary.total_costo).toBe(0)
  })
})

describe('ComisionesService.saveCosto()', () => {
  it('rejects a USD cost without tipo_cambio', async () => {
    const repo    = makeMockRepo()
    const service = new ComisionesService(repo)

    await expect(
      service.saveCosto({ opportunity_id: '00000000-0000-4000-8000-000000000001', costo: 1000, moneda: 'USD' }, 'user-1'),
    ).rejects.toThrow()

    expect(repo.upsertCost).not.toHaveBeenCalled()
  })

  it('accepts a USD cost with tipo_cambio', async () => {
    const repo    = makeMockRepo()
    const service = new ComisionesService(repo)

    await service.saveCosto(
      { opportunity_id: '00000000-0000-4000-8000-000000000001', costo: 1000, moneda: 'USD', tipo_cambio: 18.5 },
      'user-1',
    )

    expect(repo.upsertCost).toHaveBeenCalledOnce()
  })
})
