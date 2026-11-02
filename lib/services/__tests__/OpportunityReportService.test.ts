import {
  OpportunityReportService,
  toRepositoryFilters,
  toReportRow,
  summarizeReport,
  computeIndicators,
} from '@/lib/services/OpportunityReportService'
import type { IOpportunityRepository, OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// 2 nov 2026, 12:00 en Ciudad de México (UTC-6)
const NOW = new Date('2026-11-02T18:00:00.000Z')

const OWNER_ID = '00000000-0000-4000-8000-000000000001'

const BASE_OPP: OpportunityWithRelations = {
  id:                    'opp-001',
  nombre:                'Termos 500 pzas',
  business_unit:         'juno_promotional',
  fuente:                'meta',
  owner_id:              OWNER_ID,
  company_id:            'co-1',
  contact_id:            'ct-1',
  etapa:                 'cotizacion_enviada',
  moneda:                'USD',
  monto_estimado:        1000,
  monto_estimado_mxn:    18500,
  monto_final:           null,
  monto_final_mxn:       null,
  tipo_cambio_estimado:  18.5,
  tipo_cambio_final:     null,
  probabilidad:          50,
  fecha_cierre_estimada: null,
  next_activity_at:      '2026-11-05T16:00:00.000Z',
  last_activity_at:      '2026-11-05T16:00:00.000Z',
  last_completed_activity_at: '2026-10-30T16:00:00.000Z',
  closed_at:             null,
  notas:                 null,
  cotizacion_path:       null,
  orden_compra_path:     null,
  stale:                 false,
  integration_client_id: null,
  created_at:            '2026-10-01T15:00:00.000Z',
  updated_at:            '2026-10-30T16:00:00.000Z',
  company: { nombre: 'Acme SA' },
  contact: { nombre: 'Ana', apellido: 'López', email: 'ana@acme.mx', telefono: '8112345678' },
  owner:   { full_name: 'Jane Doe' },
} as OpportunityWithRelations

function makeMockRepo(rows: OpportunityWithRelations[] = []): IOpportunityRepository {
  return {
    findById:              vi.fn(),
    findAll:               vi.fn().mockResolvedValue(rows),
    findStale:             vi.fn(),
    getDashboardStats:     vi.fn(),
    getExecutiveDashboard: vi.fn(),
    create:                vi.fn(),
    update:                vi.fn(),
    delete:                vi.fn(),
  }
}

const OPEN = ['nuevo_lead', 'contactado', 'diagnostico', 'cotizacion_enviada', 'seguimiento', 'negociacion']

// ---------------------------------------------------------------------------
// toRepositoryFilters
// ---------------------------------------------------------------------------

describe('toRepositoryFilters', () => {
  it('sin filtros no restringe nada', () => {
    expect(toRepositoryFilters({ fecha: 'creacion' }, NOW)).toEqual({})
  })

  it('pasa vendedor y unidad tal cual', () => {
    expect(toRepositoryFilters({ fecha: 'creacion', owner: OWNER_ID, unit: 'thunder_led' }, NOW))
      .toEqual({ ownerId: OWNER_ID, businessUnit: 'thunder_led' })
  })

  it('el rango de fechas cubre días completos en hora de México', () => {
    const f = toRepositoryFilters({ fecha: 'creacion', desde: '2026-10-01', hasta: '2026-10-31' }, NOW)
    expect(f.createdFrom).toBe('2026-10-01T06:00:00.000Z')
    // hasta es inclusivo: corta al inicio del día siguiente
    expect(f.createdBefore).toBe('2026-11-01T06:00:00.000Z')
    expect(f.closedFrom).toBeUndefined()
  })

  it('con fecha de cierre el rango filtra closed_at', () => {
    const f = toRepositoryFilters({ fecha: 'cierre', desde: '2026-10-01', hasta: '2026-10-31' }, NOW)
    expect(f.closedFrom).toBe('2026-10-01T06:00:00.000Z')
    expect(f.closedBefore).toBe('2026-11-01T06:00:00.000Z')
    expect(f.createdFrom).toBeUndefined()
  })

  it('estado abierta → etapas abiertas', () => {
    expect(toRepositoryFilters({ fecha: 'creacion', estado: 'abierta' }, NOW).stages).toEqual(OPEN)
  })

  it('estado ganada → sólo ganado', () => {
    expect(toRepositoryFilters({ fecha: 'creacion', estado: 'ganada' }, NOW).stages).toEqual(['ganado'])
  })

  it('cotización pendiente → etapa cotizacion_enviada', () => {
    expect(toRepositoryFilters({ fecha: 'creacion', alerta: 'cotizacion_pendiente' }, NOW).stages).toEqual(['cotizacion_enviada'])
  })

  it('sin seguimiento → abiertas sin next_activity_at', () => {
    const f = toRepositoryFilters({ fecha: 'creacion', alerta: 'sin_seguimiento' }, NOW)
    expect(f.stages).toEqual(OPEN)
    expect(f.nextActivityMissing).toBe(true)
  })

  it('seguimiento vencido → abiertas con próxima actividad antes de hoy (día de México)', () => {
    const f = toRepositoryFilters({ fecha: 'creacion', alerta: 'seguimiento_vencido' }, NOW)
    expect(f.stages).toEqual(OPEN)
    expect(f.nextActivityBefore).toBe('2026-11-02T06:00:00.000Z')
  })

  it('sin actividad → flag stale', () => {
    const f = toRepositoryFilters({ fecha: 'creacion', alerta: 'sin_actividad' }, NOW)
    expect(f.stale).toBe(true)
    expect(f.stages).toEqual(OPEN)
  })

  it('etapa + estado compatibles se intersectan', () => {
    expect(toRepositoryFilters({ fecha: 'creacion', stage: 'negociacion', estado: 'abierta' }, NOW).stages).toEqual(['negociacion'])
  })

  it('combinación contradictoria da lista vacía', () => {
    expect(toRepositoryFilters({ fecha: 'creacion', estado: 'ganada', alerta: 'sin_seguimiento' }, NOW).stages).toEqual([])
    expect(toRepositoryFilters({ fecha: 'creacion', stage: 'perdido', alerta: 'cotizacion_pendiente' }, NOW).stages).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// toReportRow
// ---------------------------------------------------------------------------

describe('toReportRow', () => {
  it('mapea las columnas del reporte', () => {
    expect(toReportRow(BASE_OPP, NOW)).toEqual({
      id:                   'opp-001',
      oportunidad:          'Termos 500 pzas',
      empresa:              'Acme SA',
      contacto:             'Ana López',
      contactoEmail:        'ana@acme.mx',
      contactoTelefono:     '8112345678',
      unidad:               'juno_promotional',
      vendedorId:           OWNER_ID,
      vendedor:             'Jane Doe',
      etapa:                'cotizacion_enviada',
      probabilidad:         50,
      montoEstimado:        1000,
      moneda:               'USD',
      montoEstimadoMxn:     18500,
      montoFinalMxn:        null,
      creadaEl:             '2026-10-01T15:00:00.000Z',
      ultimaActividadEl:    '2026-10-30T16:00:00.000Z',
      proximoSeguimientoEl: '2026-11-05T16:00:00.000Z',
      cerradaEl:            null,
      estado:               'abierta',
      seguimiento:          'programada',
      sinActividad:         false,
      origen:               'meta',
    })
  })

  it('contacto sin apellido y sin empresa', () => {
    const row = toReportRow({
      ...BASE_OPP,
      company: null,
      contact: { nombre: 'Ana', apellido: null, email: null, telefono: null },
    }, NOW)
    expect(row.empresa).toBeNull()
    expect(row.contacto).toBe('Ana')
  })

  it('sin monto en MXN cae al monto estimado', () => {
    const row = toReportRow({ ...BASE_OPP, moneda: 'MXN', monto_estimado_mxn: null }, NOW)
    expect(row.montoEstimadoMxn).toBe(1000)
  })

  it('seguimiento: vencida, hoy y sin seguimiento', () => {
    expect(toReportRow({ ...BASE_OPP, next_activity_at: '2026-11-01T20:00:00.000Z' }, NOW).seguimiento).toBe('vencida')
    // 2 nov 09:00 en México: ya pasó la hora pero sigue siendo "hoy"
    expect(toReportRow({ ...BASE_OPP, next_activity_at: '2026-11-02T15:00:00.000Z' }, NOW).seguimiento).toBe('hoy')
    expect(toReportRow({ ...BASE_OPP, next_activity_at: null }, NOW).seguimiento).toBe('sin_seguimiento')
  })

  it('oportunidades cerradas no tienen seguimiento', () => {
    const row = toReportRow({ ...BASE_OPP, etapa: 'ganado', next_activity_at: null }, NOW)
    expect(row.estado).toBe('ganada')
    expect(row.seguimiento).toBeNull()
    expect(toReportRow({ ...BASE_OPP, etapa: 'sin_respuesta' }, NOW).estado).toBe('sin_respuesta')
    expect(toReportRow({ ...BASE_OPP, etapa: 'perdido' }, NOW).estado).toBe('perdida')
  })
})

// ---------------------------------------------------------------------------
// computeIndicators
// ---------------------------------------------------------------------------

describe('computeIndicators', () => {
  const OTHER_OWNER = '00000000-0000-4000-8000-000000000002'
  const opp = (o: Partial<OpportunityWithRelations>) => toReportRow({ ...BASE_OPP, ...o } as OpportunityWithRelations, NOW)

  const rows = [
    // Jane — juno: cotización abierta USD (18,500 MXN, 50%), programada
    opp({ id: 'a' }),
    // Jane — juno: abierta sin seguimiento y stale (10,000, 20%)
    opp({ id: 'b', etapa: 'seguimiento', moneda: 'MXN', monto_estimado: 10000, monto_estimado_mxn: 10000, probabilidad: 20, next_activity_at: null, stale: true }),
    // Jane — thunder_led: abierta vencida (5,000, 10%)
    opp({ id: 'c', etapa: 'negociacion', business_unit: 'thunder_led', moneda: 'MXN', monto_estimado: 5000, monto_estimado_mxn: 5000, probabilidad: 10, next_activity_at: '2026-10-20T16:00:00.000Z' }),
    // Otro vendedor — thunder_led: ganada 40,000 y perdida 7,000 y sin respuesta 3,000
    opp({ id: 'd', etapa: 'ganado', business_unit: 'thunder_led', owner_id: OTHER_OWNER, owner: { full_name: 'Bob' }, moneda: 'MXN', monto_estimado: 35000, monto_estimado_mxn: 35000, monto_final_mxn: 40000 }),
    opp({ id: 'e', etapa: 'perdido', business_unit: 'thunder_led', owner_id: OTHER_OWNER, owner: { full_name: 'Bob' }, moneda: 'MXN', monto_estimado: 7000, monto_estimado_mxn: 7000 }),
    opp({ id: 'f', etapa: 'sin_respuesta', business_unit: 'thunder_led', owner_id: OTHER_OWNER, owner: { full_name: 'Bob' }, moneda: 'MXN', monto_estimado: 3000, monto_estimado_mxn: 3000 }),
  ]

  it('totales de pipeline, seguimiento y resultados', () => {
    const k = computeIndicators(rows)
    expect(k.abiertas).toEqual({ count: 3, pipelineMxn: 33500, ponderadoMxn: 9250 + 2000 + 500 })
    expect(k.cotizacionesEnviadas).toEqual({ count: 1, montoMxn: 18500 })
    expect(k.sinSeguimiento).toBe(1)
    expect(k.seguimientosVencidos).toBe(1)
    expect(k.sinActividad).toBe(1)
    expect(k.ganadas).toEqual({ count: 1, montoMxn: 40000 })
    expect(k.perdidas).toEqual({ count: 2, sinRespuesta: 1, montoMxn: 10000 })
    expect(k.conversion).toBeCloseTo(1 / 3)
  })

  it('desglose por unidad ordenado por pipeline', () => {
    const [juno, led] = computeIndicators(rows).porUnidad
    expect(juno).toMatchObject({ key: 'juno_promotional', label: 'Juno Promotional', abiertas: 2, pipelineMxn: 28500, ganadas: 0, conversion: null })
    expect(led).toMatchObject({ key: 'thunder_led', abiertas: 1, pipelineMxn: 5000, ganadas: 1, ganadoMxn: 40000, perdidas: 2 })
    expect(led.conversion).toBeCloseTo(1 / 3)
  })

  it('desglose por vendedor', () => {
    const porVendedor = computeIndicators(rows).porVendedor
    expect(porVendedor.map(v => v.label)).toEqual(['Jane Doe', 'Bob'])
    expect(porVendedor[1]).toMatchObject({ key: OTHER_OWNER, abiertas: 0, ganadas: 1, perdidas: 2 })
  })

  it('sin filas no divide entre cero', () => {
    const k = computeIndicators([])
    expect(k.conversion).toBeNull()
    expect(k.porUnidad).toEqual([])
    expect(k.abiertas.count).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// summarizeReport
// ---------------------------------------------------------------------------

describe('summarizeReport', () => {
  it('cuenta y suma en MXN', () => {
    const rows = [
      toReportRow(BASE_OPP, NOW),
      toReportRow({ ...BASE_OPP, id: 'opp-002', moneda: 'MXN', monto_estimado: 5000, monto_estimado_mxn: 5000 }, NOW),
    ]
    expect(summarizeReport(rows)).toEqual({ count: 2, montoEstimadoMxn: 23500 })
  })

  it('reporte vacío', () => {
    expect(summarizeReport([])).toEqual({ count: 0, montoEstimadoMxn: 0 })
  })
})

// ---------------------------------------------------------------------------
// OpportunityReportService.listOpportunities
// ---------------------------------------------------------------------------

describe('OpportunityReportService.listOpportunities', () => {
  it('consulta con los filtros traducidos y devuelve filas del reporte', async () => {
    const repo = makeMockRepo([BASE_OPP])
    const rows = await new OpportunityReportService(repo)
      .listOpportunities({ unit: 'juno_promotional', alerta: 'cotizacion_pendiente' }, NOW)

    expect(repo.findAll).toHaveBeenCalledWith({ businessUnit: 'juno_promotional', stages: ['cotizacion_enviada'] })
    expect(rows).toHaveLength(1)
    expect(rows[0].oportunidad).toBe('Termos 500 pzas')
  })

  it('no consulta la DB si los filtros se contradicen', async () => {
    const repo = makeMockRepo([BASE_OPP])
    const rows = await new OpportunityReportService(repo)
      .listOpportunities({ estado: 'perdida', alerta: 'seguimiento_vencido' }, NOW)

    expect(rows).toEqual([])
    expect(repo.findAll).not.toHaveBeenCalled()
  })

  it('ignora valores inválidos de la URL en vez de fallar', async () => {
    const repo = makeMockRepo()
    await new OpportunityReportService(repo).listOpportunities({
      unit:   'no_existe',
      owner:  'no-es-uuid',
      desde:  '2026-13-45',
      hasta:  ['2026-10-01', '2026-10-02'],
      estado: 'ganada',
      view:   'list',
    }, NOW)

    expect(repo.findAll).toHaveBeenCalledWith({ stages: ['ganado'] })
  })

  it('fecha inválida cae a creación', async () => {
    const repo = makeMockRepo()
    await new OpportunityReportService(repo).listOpportunities({ fecha: 'otra', desde: '2026-10-01' }, NOW)
    expect(repo.findAll).toHaveBeenCalledWith({ createdFrom: '2026-10-01T06:00:00.000Z' })
  })

  it('acepta filtros undefined', async () => {
    const repo = makeMockRepo()
    await new OpportunityReportService(repo).listOpportunities(undefined, NOW)
    expect(repo.findAll).toHaveBeenCalledWith({})
  })
})
