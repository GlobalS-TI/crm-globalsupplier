import { OpportunityFileService } from '@/lib/services/OpportunityFileService'
import type { IOpportunityFileRepository, OpportunityFileRow } from '@/lib/repositories/interfaces/IOpportunityFileRepository'

const BASE_FILE: OpportunityFileRow = {
  id:             'file-001',
  opportunity_id: 'opp-001',
  categoria:      'cotizacion',
  file_path:      'opportunity-docs/opp-001/cotizacion-123-quote.pdf',
  nombre:         'quote.pdf',
  mime_type:      'application/pdf',
  file_size:      1024,
  owner_id:       '00000000-0000-0000-0000-000000000001',
  created_at:     '2026-06-01T00:00:00.000Z',
}

function makeMockRepo(overrides: Partial<IOpportunityFileRepository> = {}): IOpportunityFileRepository {
  return {
    listByOpportunity: vi.fn().mockResolvedValue([]),
    findById:          vi.fn().mockResolvedValue(BASE_FILE),
    create:            vi.fn().mockResolvedValue(BASE_FILE),
    delete:            vi.fn().mockResolvedValue(undefined),
    getSignedUrl:      vi.fn().mockResolvedValue('https://signed.example/url'),
    ...overrides,
  }
}

describe('OpportunityFileService.addFile()', () => {
  it('parses input via schema and forwards owner_id to the repo', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityFileService(repo)

    const oppId = '00000000-0000-4000-8000-000000000001'
    await service.addFile({
      opportunity_id: oppId,
      nombre:         'quote.pdf',
      file_path:      'opportunity-docs/opp-001/cotizacion-123-quote.pdf',
    }, 'user-001')

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({
      opportunity_id: oppId,
      nombre:         'quote.pdf',
      categoria:      'otro',
      owner_id:       'user-001',
    }))
  })

  it('rejects invalid input (missing nombre)', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityFileService(repo)

    await expect(
      service.addFile({ opportunity_id: '00000000-0000-4000-8000-000000000001', file_path: 'x' }, 'user-001'),
    ).rejects.toThrow()

    expect(repo.create).not.toHaveBeenCalled()
  })
})

describe('OpportunityFileService.deleteFile()', () => {
  it('throws when the file is not found', async () => {
    const repo    = makeMockRepo({ findById: vi.fn().mockResolvedValue(null) })
    const service = new OpportunityFileService(repo)

    await expect(
      service.deleteFile('missing', { etapa: 'contactado', cotizacion_path: null, orden_compra_path: null }),
    ).rejects.toThrow('Archivo no encontrado')

    expect(repo.delete).not.toHaveBeenCalled()
  })

  it('throws when the opportunity is ganado and the file backs the cotización', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityFileService(repo)

    await expect(
      service.deleteFile('file-001', {
        etapa: 'ganado',
        cotizacion_path: BASE_FILE.file_path,
        orden_compra_path: null,
      }),
    ).rejects.toThrow('No se puede eliminar un archivo usado para cerrar esta oportunidad como ganada')

    expect(repo.delete).not.toHaveBeenCalled()
  })

  it('throws when the opportunity is ganado and the file backs the orden de compra', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityFileService(repo)

    await expect(
      service.deleteFile('file-001', {
        etapa: 'ganado',
        cotizacion_path: null,
        orden_compra_path: BASE_FILE.file_path,
      }),
    ).rejects.toThrow()

    expect(repo.delete).not.toHaveBeenCalled()
  })

  it('deletes normally when the opportunity is ganado but the file is unrelated to the closing docs', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityFileService(repo)

    await service.deleteFile('file-001', {
      etapa: 'ganado',
      cotizacion_path: 'opportunity-docs/opp-001/otro.pdf',
      orden_compra_path: 'opportunity-docs/opp-001/otro2.pdf',
    })

    expect(repo.delete).toHaveBeenCalledWith('file-001')
  })

  it('deletes normally when the opportunity is still open', async () => {
    const repo    = makeMockRepo()
    const service = new OpportunityFileService(repo)

    await service.deleteFile('file-001', {
      etapa: 'contactado',
      cotizacion_path: BASE_FILE.file_path,
      orden_compra_path: null,
    })

    expect(repo.delete).toHaveBeenCalledWith('file-001')
  })
})
