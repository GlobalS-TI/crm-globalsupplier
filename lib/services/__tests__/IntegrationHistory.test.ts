import { ZodError } from 'zod'
import { IntegrationService } from '@/lib/services/IntegrationService'
import type {
  IIntegrationRepository,
  IntegrationHistoryActivity,
  IntegrationHistoryOpportunitySource,
} from '@/lib/repositories/interfaces/IIntegrationRepository'

const KEY_HASH   = 'a'.repeat(64)
const OPP_ID     = '11111111-1111-4111-8111-111111111111'
const COMPANY_ID = '22222222-2222-4222-8222-222222222222'
const CONTACT_ID = '33333333-3333-4333-8333-333333333333'
const OWNER_ID   = '00000000-0000-4000-8000-000000000001'
// 2 nov 2026, 12:00 en Ciudad de México
const NOW = new Date('2026-11-02T18:00:00.000Z')

const ACTIVITY: IntegrationHistoryActivity = {
  id:                     '44444444-4444-4444-8444-444444444444',
  tipo:                   'llamada',
  estatus:                'completada',
  titulo:                 'Llamada de descubrimiento',
  descripcion:            'Confirma 500 piezas',
  fecha:                  '2026-10-20T16:00:00+00:00',
  completed_at:           '2026-10-20T16:40:00+00:00',
  created_at:             '2026-10-18T14:00:00+00:00',
  vendedor:               { id: OWNER_ID, nombre: 'Jane Doe' },
  creada_por_integracion: false,
}

const OPPORTUNITY: IntegrationHistoryOpportunitySource = {
  id:                         OPP_ID,
  nombre:                     'Señalética planta Apodaca',
  business_unit:              'thunder_safety',
  owner_id:                   OWNER_ID,
  etapa:                      'cotizacion_enviada',
  probabilidad:               60,
  fuente:                     'referido',
  monto_estimado:             100000,
  moneda:                     'MXN',
  monto_estimado_mxn:         100000,
  monto_final_mxn:            null,
  created_at:                 '2026-10-01T15:00:00.000Z',
  last_completed_activity_at: '2026-10-20T16:40:00+00:00',
  next_activity_at:           '2026-11-05T16:00:00.000Z',
  closed_at:                  null,
  closed_by:                  null,
  stale:                      false,
  fecha_cierre_estimada:      null,
  notas:                      null,
  company:     { nombre: 'Acme SA' },
  contact:     { nombre: 'Ana', apellido: 'López', puesto: 'Compras', email: null, telefono: null, celular: null },
  owner:       { full_name: 'Jane Doe' },
  closer:      null,
  company_id:  COMPANY_ID,
  contact_id:  CONTACT_ID,
  actividades: [ACTIVITY],
}

function makeRepo() {
  const repo = {
    findHistoryOpportunity: vi.fn().mockResolvedValue(OPPORTUNITY),
    findHistoryActivities:  vi.fn().mockResolvedValue({ total: 1, rows: [ACTIVITY] }),
    findHistoryCompanies:   vi.fn().mockResolvedValue({ total: 0, rows: [] }),
    findHistoryCompany:     vi.fn().mockResolvedValue({}),
    findHistoryContacts:    vi.fn().mockResolvedValue({ total: 0, rows: [] }),
    findHistoryContact:     vi.fn().mockResolvedValue({}),
  }
  return { repo, service: new IntegrationService(repo as unknown as IIntegrationRepository) }
}

describe('IntegrationService.getHistoryOpportunity', () => {
  it('misma forma que análisis más ids y actividades', async () => {
    const { service } = makeRepo()
    const opp = await service.getHistoryOpportunity(KEY_HASH, OPP_ID, NOW)
    expect(opp).toMatchObject({
      id:          OPP_ID,
      estado:      'abierta',
      seguimiento: 'programada',
      empresa:     'Acme SA',
      contacto:    { nombre: 'Ana López', email: null },
      vendedor:    { id: OWNER_ID, nombre: 'Jane Doe' },
      company_id:  COMPANY_ID,
      contact_id:  CONTACT_ID,
      actividades: [ACTIVITY],
    })
  })

  it('rechaza un id que no es UUID sin consultar la DB', async () => {
    const { repo, service } = makeRepo()
    await expect(service.getHistoryOpportunity(KEY_HASH, 'abc')).rejects.toBeInstanceOf(ZodError)
    expect(repo.findHistoryOpportunity).not.toHaveBeenCalled()
  })
})

describe('IntegrationService.listHistoryActivities', () => {
  it('por defecto 100 por página, filtrando por fecha programada', async () => {
    const { repo, service } = makeRepo()
    const result = await service.listHistoryActivities(KEY_HASH, { opportunity_id: OPP_ID })
    expect(repo.findHistoryActivities).toHaveBeenCalledWith(KEY_HASH, {
      filters: expect.objectContaining({ opportunityId: OPP_ID, dateField: 'fecha', dateFrom: undefined }),
      limit:   100,
      offset:  0,
    })
    expect(result).toEqual({ total: 1, limit: 100, offset: 0, actividades: [ACTIVITY] })
  })

  it('desde/hasta son días de México inclusivos sobre la fecha elegida', async () => {
    const { repo, service } = makeRepo()
    await service.listHistoryActivities(KEY_HASH, {
      fecha: 'completada', desde: '2026-10-01', hasta: '2026-10-31', limit: '50', offset: '50',
    })
    expect(repo.findHistoryActivities).toHaveBeenCalledWith(KEY_HASH, {
      filters: expect.objectContaining({
        dateField:  'completed_at',
        dateFrom:   '2026-10-01T06:00:00.000Z',
        dateBefore: '2026-11-01T06:00:00.000Z',
      }),
      limit:  50,
      offset: 50,
    })
  })

  it.each([
    ['parámetro desconocido', { estatus_x: 'completada' }],
    ['tipo inválido',         { tipo: 'whatsapp' }],
    ['rango invertido',       { desde: '2026-10-31', hasta: '2026-10-01' }],
    ['limit mayor a 500',     { limit: '501' }],
    ['opportunity_id no UUID', { opportunity_id: '123' }],
  ])('responde 422 ante %s sin consultar la DB', async (_, query) => {
    const { repo, service } = makeRepo()
    await expect(service.listHistoryActivities(KEY_HASH, query)).rejects.toBeInstanceOf(ZodError)
    expect(repo.findHistoryActivities).not.toHaveBeenCalled()
  })
})

describe('IntegrationService.listHistoryCompanies / listHistoryContacts', () => {
  it('pasa búsqueda y paginación', async () => {
    const { repo, service } = makeRepo()
    const result = await service.listHistoryCompanies(KEY_HASH, { q: ' acme ', limit: '10' })
    expect(repo.findHistoryCompanies).toHaveBeenCalledWith(KEY_HASH, { q: 'acme', limit: 10, offset: 0 })
    expect(result).toEqual({ total: 0, limit: 10, offset: 0, empresas: [] })
  })

  it('filtra contactos por empresa', async () => {
    const { repo, service } = makeRepo()
    const result = await service.listHistoryContacts(KEY_HASH, { company_id: COMPANY_ID })
    expect(repo.findHistoryContacts).toHaveBeenCalledWith(KEY_HASH, {
      companyId: COMPANY_ID, q: undefined, limit: 100, offset: 0,
    })
    expect(result).toEqual({ total: 0, limit: 100, offset: 0, contactos: [] })
  })

  it('búsqueda de menos de 2 caracteres o parámetro desconocido → 422', async () => {
    const { service } = makeRepo()
    await expect(service.listHistoryCompanies(KEY_HASH, { q: 'a' })).rejects.toBeInstanceOf(ZodError)
    await expect(service.listHistoryContacts(KEY_HASH, { email: 'x@y.com' })).rejects.toBeInstanceOf(ZodError)
  })
})
