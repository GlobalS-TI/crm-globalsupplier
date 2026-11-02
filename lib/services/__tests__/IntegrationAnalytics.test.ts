import { ZodError } from 'zod'
import { IntegrationService } from '@/lib/services/IntegrationService'
import { IntegrationAdminService } from '@/lib/services/IntegrationAdminService'
import type {
  IIntegrationRepository,
  IntegrationAnalyticsSource,
} from '@/lib/repositories/interfaces/IIntegrationRepository'
import type { IIntegrationAdminRepository } from '@/lib/repositories/interfaces/IIntegrationAdminRepository'

const KEY_HASH  = 'a'.repeat(64)
const OWNER_ID  = '00000000-0000-4000-8000-000000000001'
const CLIENT_ID = '00000000-0000-4000-8000-0000000000c1'
// 2 nov 2026, 12:00 en Ciudad de México
const NOW = new Date('2026-11-02T18:00:00.000Z')

const SOURCE: IntegrationAnalyticsSource = {
  id:                         'opp-1',
  nombre:                     'Uniformes planta Apodaca',
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
  last_completed_activity_at: '2026-10-25T16:00:00.000Z',
  next_activity_at:           '2026-10-30T16:00:00.000Z',
  closed_at:                  null,
  stale:                      true,
  fecha_cierre_estimada:      '2026-11-30',
  notas:                      'Piden muestra',
  company: { nombre: 'Acme SA' },
  contact: { nombre: 'Ana', apellido: 'López', puesto: 'Compras', email: null, telefono: null, celular: null },
  owner:   { full_name: 'Jane Doe' },
}

function makeRepo(rows: IntegrationAnalyticsSource[] = [SOURCE], total = rows.length) {
  const findAnalyticsOpportunities = vi.fn().mockResolvedValue({ total, rows })
  const repo = { findAnalyticsOpportunities } as unknown as IIntegrationRepository
  return { repo, findAnalyticsOpportunities }
}

describe('IntegrationService.listAnalyticsOpportunities', () => {
  it('traduce los filtros igual que /reportes y pagina', async () => {
    const { repo, findAnalyticsOpportunities } = makeRepo()
    await new IntegrationService(repo).listAnalyticsOpportunities(
      KEY_HASH,
      { unit: 'thunder_safety', alerta: 'cotizacion_pendiente', desde: '2026-10-01', limit: '50', offset: '100' },
      NOW,
    )
    expect(findAnalyticsOpportunities).toHaveBeenCalledWith(KEY_HASH, {
      operation: 'analytics_opportunities',
      filters: {
        businessUnit: 'thunder_safety',
        stages:       ['cotizacion_enviada'],
        createdFrom:  '2026-10-01T06:00:00.000Z',
      },
      limit:  50,
      offset: 100,
    })
  })

  it('por defecto 100 por página', async () => {
    const { repo, findAnalyticsOpportunities } = makeRepo()
    const result = await new IntegrationService(repo).listAnalyticsOpportunities(KEY_HASH, {}, NOW)
    expect(findAnalyticsOpportunities.mock.calls[0][1]).toMatchObject({ limit: 100, offset: 0 })
    expect(result).toMatchObject({ total: 1, limit: 100, offset: 0 })
  })

  it('mapea a la forma pública con estado y seguimiento de /reportes', async () => {
    const { repo } = makeRepo()
    const { oportunidades: [opp] } = await new IntegrationService(repo).listAnalyticsOpportunities(KEY_HASH, {}, NOW)
    expect(opp).toEqual({
      id:                         'opp-1',
      nombre:                     'Uniformes planta Apodaca',
      business_unit:              'thunder_safety',
      etapa:                      'cotizacion_enviada',
      estado:                     'abierta',
      seguimiento:                'vencida',
      sin_actividad:              true,
      fuente:                     'referido',
      probabilidad:               60,
      moneda:                     'MXN',
      monto_estimado:             100000,
      monto_estimado_mxn:         100000,
      monto_final_mxn:            null,
      fecha_cierre_estimada:      '2026-11-30',
      created_at:                 '2026-10-01T15:00:00.000Z',
      last_completed_activity_at: '2026-10-25T16:00:00.000Z',
      next_activity_at:           '2026-10-30T16:00:00.000Z',
      closed_at:                  null,
      notas:                      'Piden muestra',
      empresa:                    'Acme SA',
      contacto: { nombre: 'Ana López', puesto: 'Compras', email: null, telefono: null, celular: null },
      vendedor: { id: OWNER_ID, nombre: 'Jane Doe' },
    })
  })

  it('pasa tal cual los datos de contacto cuando la DB los envía', async () => {
    const { repo } = makeRepo([{
      ...SOURCE,
      contact: { ...SOURCE.contact!, email: 'ana@acme.mx', telefono: '8110000000', celular: '8120000000' },
    }])
    const { oportunidades: [opp] } = await new IntegrationService(repo).listAnalyticsOpportunities(KEY_HASH, {}, NOW)
    expect(opp.contacto).toMatchObject({ email: 'ana@acme.mx', telefono: '8110000000', celular: '8120000000' })
  })

  it('sin contacto → contacto null', async () => {
    const { repo } = makeRepo([{ ...SOURCE, contact: null }])
    const { oportunidades: [opp] } = await new IntegrationService(repo).listAnalyticsOpportunities(KEY_HASH, {}, NOW)
    expect(opp.contacto).toBeNull()
  })

  it.each([
    ['filtro desconocido',   { etapa: 'ganado' }],
    ['unidad inválida',      { unit: 'no_existe' }],
    ['fecha mal formada',    { desde: '01/10/2026' }],
    ['rango invertido',      { desde: '2026-10-31', hasta: '2026-10-01' }],
    ['limit fuera de rango', { limit: '1000' }],
    ['offset negativo',      { offset: '-1' }],
  ])('rechaza %s con 422 en vez de ignorarlo', async (_, query) => {
    const { repo, findAnalyticsOpportunities } = makeRepo()
    await expect(new IntegrationService(repo).listAnalyticsOpportunities(KEY_HASH, query, NOW))
      .rejects.toBeInstanceOf(ZodError)
    expect(findAnalyticsOpportunities).not.toHaveBeenCalled()
  })

  it('filtros contradictorios igual consultan la DB (autenticación y bitácora)', async () => {
    const { repo, findAnalyticsOpportunities } = makeRepo([], 0)
    await new IntegrationService(repo).listAnalyticsOpportunities(KEY_HASH, { estado: 'ganada', alerta: 'sin_seguimiento' }, NOW)
    expect(findAnalyticsOpportunities.mock.calls[0][1].filters.stages).toEqual([])
  })
})

describe('IntegrationService.getAnalyticsIndicators', () => {
  it('pide todas las filas (sin limit) y calcula los indicadores de /reportes', async () => {
    const won: IntegrationAnalyticsSource = {
      ...SOURCE, id: 'opp-2', etapa: 'ganado', monto_final_mxn: 80000, closed_at: '2026-10-20T16:00:00.000Z', stale: false,
    }
    const { repo, findAnalyticsOpportunities } = makeRepo([SOURCE, won])
    const result = await new IntegrationService(repo).getAnalyticsIndicators(KEY_HASH, { fecha: 'creacion' }, NOW)

    expect(findAnalyticsOpportunities).toHaveBeenCalledWith(KEY_HASH, { operation: 'analytics_indicators', filters: {} })
    expect(result.total).toBe(2)
    expect(result.indicadores.abiertas).toEqual({ count: 1, pipelineMxn: 100000, ponderadoMxn: 60000 })
    expect(result.indicadores.seguimientosVencidos).toBe(1)
    expect(result.indicadores.ganadas).toEqual({ count: 1, montoMxn: 80000 })
    expect(result.indicadores.conversion).toBe(1)
  })

  it('no acepta paginación', async () => {
    const { repo } = makeRepo()
    await expect(new IntegrationService(repo).getAnalyticsIndicators(KEY_HASH, { limit: '10' }, NOW))
      .rejects.toBeInstanceOf(ZodError)
  })
})

describe('IntegrationAdminService.updatePermissions', () => {
  function makeAdminRepo() {
    const updatePermissions = vi.fn().mockResolvedValue(undefined)
    const repo: IIntegrationAdminRepository = { findClients: vi.fn(), updatePermissions }
    return { repo, updatePermissions }
  }

  it('guarda ambos permisos', async () => {
    const { repo, updatePermissions } = makeAdminRepo()
    await new IntegrationAdminService(repo).updatePermissions({
      client_id: CLIENT_ID, can_read_analytics: true, can_read_contact_pii: true,
    })
    expect(updatePermissions).toHaveBeenCalledWith({
      client_id: CLIENT_ID, can_read_analytics: true, can_read_contact_pii: true,
    })
  })

  it('apagar análisis apaga también los datos de contacto', async () => {
    const { repo, updatePermissions } = makeAdminRepo()
    await new IntegrationAdminService(repo).updatePermissions({
      client_id: CLIENT_ID, can_read_analytics: false, can_read_contact_pii: true,
    })
    expect(updatePermissions).toHaveBeenCalledWith({
      client_id: CLIENT_ID, can_read_analytics: false, can_read_contact_pii: false,
    })
  })

  it('rechaza datos inválidos', async () => {
    const { repo, updatePermissions } = makeAdminRepo()
    await expect(new IntegrationAdminService(repo).updatePermissions({ client_id: 'x', can_read_analytics: 'si' }))
      .rejects.toBeInstanceOf(ZodError)
    expect(updatePermissions).not.toHaveBeenCalled()
  })
})
