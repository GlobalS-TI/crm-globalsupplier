import type { IOpportunityFileRepository, OpportunityFileRow } from '@/lib/repositories/interfaces/IOpportunityFileRepository'
import { createOpportunityFileSchema } from '@/lib/validations/opportunityFile'

export type ClosingOpportunity = {
  etapa:              string
  cotizacion_path:    string | null
  orden_compra_path:  string | null
}

export class OpportunityFileService {
  constructor(private readonly repo: IOpportunityFileRepository) {}

  listByOpportunity(opportunityId: string): Promise<OpportunityFileRow[]> {
    return this.repo.listByOpportunity(opportunityId)
  }

  async addFile(raw: unknown, ownerId: string): Promise<OpportunityFileRow> {
    const data = createOpportunityFileSchema.parse(raw)
    return this.repo.create({ ...data, owner_id: ownerId })
  }

  async deleteFile(id: string, opp: ClosingOpportunity): Promise<void> {
    const file = await this.repo.findById(id)
    if (!file) throw new Error('Archivo no encontrado')

    // Nunca dejar un cierre "ganado" sin soporte: si este archivo es el que
    // se confirmó como cotización u orden de compra, no se puede borrar.
    const isClosingDoc = opp.etapa === 'ganado'
      && (file.file_path === opp.cotizacion_path || file.file_path === opp.orden_compra_path)
    if (isClosingDoc) {
      throw new Error('No se puede eliminar un archivo usado para cerrar esta oportunidad como ganada')
    }

    await this.repo.delete(id)
  }

  getSignedUrl(filePath: string, expiresIn?: number): Promise<string> {
    return this.repo.getSignedUrl(filePath, expiresIn)
  }
}
