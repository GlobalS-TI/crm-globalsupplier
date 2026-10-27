import { ZodError } from 'zod'
import { IntegrationService } from '@/lib/services/IntegrationService'
import type { IIntegrationRepository } from '@/lib/repositories/interfaces/IIntegrationRepository'

const KEY_HASH = 'a'.repeat(64)
const OPP_ID   = '11111111-1111-4111-8111-111111111111'

function makeMockRepo(overrides: Partial<IIntegrationRepository> = {}): IIntegrationRepository {
  return {
    lookup:            vi.fn().mockResolvedValue({ empresas: [], contactos: [] }),
    findCompany:       vi.fn().mockResolvedValue({}),
    findContact:       vi.fn().mockResolvedValue({}),
    createCompany:     vi.fn().mockResolvedValue({}),
    createContact:     vi.fn().mockResolvedValue({}),
    findOpportunities: vi.fn().mockResolvedValue([]),
    findOpportunity:   vi.fn().mockResolvedValue({}),
    createOpportunity: vi.fn().mockResolvedValue({}),
    updateOpportunity: vi.fn().mockResolvedValue({}),
    createActivity:    vi.fn().mockResolvedValue({}),
    updateActivity:    vi.fn().mockResolvedValue({}),
    ...overrides,
  }
}

describe('IntegrationService.findDuplicates', () => {
  it('requiere al menos un criterio', async () => {
    const service = new IntegrationService(makeMockRepo())
    await expect(service.findDuplicates(KEY_HASH, {})).rejects.toBeInstanceOf(ZodError)
  })

  it('rechaza teléfonos con menos de 10 dígitos', async () => {
    const service = new IntegrationService(makeMockRepo())
    await expect(service.findDuplicates(KEY_HASH, { telefono: '81-123' })).rejects.toBeInstanceOf(ZodError)
  })

  it('pasa el criterio al repositorio', async () => {
    const repo = makeMockRepo()
    await new IntegrationService(repo).findDuplicates(KEY_HASH, { rfc: 'ABC010101AB1' })
    expect(repo.lookup).toHaveBeenCalledWith(KEY_HASH, { rfc: 'ABC010101AB1' })
  })
})

describe('IntegrationService.createOpportunity', () => {
  const VALID = { nombre: 'Termos 500 pzas', next_activity_at: '2026-11-01T16:00:00.000Z' }

  it('rechaza etapas reservadas para personas', async () => {
    const service = new IntegrationService(makeMockRepo())
    for (const etapa of ['ganado', 'perdido', 'sin_respuesta']) {
      await expect(service.createOpportunity(KEY_HASH, { ...VALID, etapa })).rejects.toBeInstanceOf(ZodError)
    }
  })

  it('requiere next_activity_at', async () => {
    const service = new IntegrationService(makeMockRepo())
    await expect(service.createOpportunity(KEY_HASH, { nombre: 'x' })).rejects.toBeInstanceOf(ZodError)
  })

  it('requiere tipo de cambio en USD', async () => {
    const service = new IntegrationService(makeMockRepo())
    await expect(service.createOpportunity(KEY_HASH, { ...VALID, moneda: 'USD' })).rejects.toBeInstanceOf(ZodError)
  })

  it('descarta dueño, unidad, fuente y monto_final enviados por quien llama', async () => {
    const repo = makeMockRepo()
    await new IntegrationService(repo).createOpportunity(KEY_HASH, {
      ...VALID,
      owner_id:      '22222222-2222-4222-8222-222222222222',
      business_unit: 'thunder_led',
      fuente:        'web',
      monto_final:   1000,
    })
    const sent = vi.mocked(repo.createOpportunity).mock.calls[0][1] as Record<string, unknown>
    expect(sent).not.toHaveProperty('owner_id')
    expect(sent).not.toHaveProperty('business_unit')
    expect(sent).not.toHaveProperty('fuente')
    expect(sent).not.toHaveProperty('monto_final')
    expect(sent.etapa).toBe('nuevo_lead')
  })
})

describe('IntegrationService.updateOpportunity', () => {
  it('rechaza ids que no son uuid', async () => {
    const service = new IntegrationService(makeMockRepo())
    await expect(service.updateOpportunity(KEY_HASH, '1; drop table', { nombre: 'x' })).rejects.toBeInstanceOf(ZodError)
  })

  it('rechaza un cuerpo vacío', async () => {
    const service = new IntegrationService(makeMockRepo())
    await expect(service.updateOpportunity(KEY_HASH, OPP_ID, {})).rejects.toBeInstanceOf(ZodError)
  })

  it('rechaza cerrar la oportunidad', async () => {
    const service = new IntegrationService(makeMockRepo())
    await expect(service.updateOpportunity(KEY_HASH, OPP_ID, { etapa: 'ganado' })).rejects.toBeInstanceOf(ZodError)
  })

  it('sólo envía los campos presentes (actualización parcial)', async () => {
    const repo = makeMockRepo()
    await new IntegrationService(repo).updateOpportunity(KEY_HASH, OPP_ID, { etapa: 'negociacion', monto_final: 5 })
    expect(repo.updateOpportunity).toHaveBeenCalledWith(KEY_HASH, OPP_ID, { etapa: 'negociacion' })
  })
})

describe('IntegrationService.createActivity', () => {
  const VALID = {
    opportunity_id: OPP_ID,
    tipo:           'llamada',
    titulo:         'Llamar para confirmar muestra',
    fecha:          '2026-11-01T16:00:00.000Z',
  }

  it('por defecto crea la actividad como pendiente', async () => {
    const repo = makeMockRepo()
    await new IntegrationService(repo).createActivity(KEY_HASH, VALID)
    expect(repo.createActivity).toHaveBeenCalledWith(KEY_HASH, { ...VALID, estatus: 'pendiente' })
  })

  it('no permite crearla cancelada', async () => {
    const service = new IntegrationService(makeMockRepo())
    await expect(service.createActivity(KEY_HASH, { ...VALID, estatus: 'cancelada' })).rejects.toBeInstanceOf(ZodError)
  })
})
