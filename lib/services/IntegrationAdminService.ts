import type {
  IIntegrationAdminRepository,
  IntegrationClientSummary,
} from '@/lib/repositories/interfaces/IIntegrationAdminRepository'
import { integrationPermissionsSchema } from '@/lib/validations/integration'

export class IntegrationAdminService {
  constructor(private readonly repo: IIntegrationAdminRepository) {}

  async listClients(): Promise<IntegrationClientSummary[]> {
    return this.repo.findClients()
  }

  // Los datos de contacto sólo se leen a través del acceso de análisis: si éste se apaga,
  // el switch de contacto se apaga con él, para que al volver a encender análisis no
  // reaparezcan email/teléfono sin que nadie lo decida de nuevo.
  async updatePermissions(raw: unknown): Promise<void> {
    const data = integrationPermissionsSchema.parse(raw)
    await this.repo.updatePermissions({
      ...data,
      can_read_contact_pii: data.can_read_analytics && data.can_read_contact_pii,
    })
  }
}
