import { businessDayStartISO, businessMonth, businessMonthStartISO, nextDayKey } from '@/lib/utils/date'

describe('fechas en hora de México (UTC-6)', () => {
  it('inicio de día', () => {
    expect(businessDayStartISO('2026-11-01')).toBe('2026-11-01T06:00:00.000Z')
  })

  it('día siguiente cruza mes y año', () => {
    expect(nextDayKey('2026-10-31')).toBe('2026-11-01')
    expect(nextDayKey('2026-12-31')).toBe('2027-01-01')
  })

  it('inicio de mes usa el mes de México, no el de UTC', () => {
    // 1 nov 03:00 UTC = 31 oct 21:00 en México → sigue siendo octubre
    expect(businessMonthStartISO(new Date('2026-11-01T03:00:00Z'))).toBe('2026-10-01T06:00:00.000Z')
    expect(businessMonthStartISO(new Date('2026-11-15T18:00:00Z'))).toBe('2026-11-01T06:00:00.000Z')
  })

  it('mes anterior cruza el año', () => {
    expect(businessMonthStartISO(new Date('2026-01-10T18:00:00Z'), -1)).toBe('2025-12-01T06:00:00.000Z')
  })

  it('mes de una venta cerrada el 31 dic por la noche es diciembre', () => {
    expect(businessMonth('2027-01-01T02:00:00Z')).toBe(12)
    expect(businessMonth('2026-03-15T18:00:00Z')).toBe(3)
  })
})
