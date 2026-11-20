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

  // Datos de contacto e historial sólo se leen a través del acceso de análisis: si éste se
  // apaga, se apagan con él, para que al volver a encender análisis no reaparezcan sin que
  // nadie lo decida de nuevo. La DB aplica la misma regla (integration_set_read_permissions).
  async updatePermissions(raw: unknown): Promise<void> {
    const data = integrationPermissionsSchema.parse(raw)
    await this.repo.updatePermissions({
      ...data,
      can_read_contact_pii: data.can_read_analytics && data.can_read_contact_pii,
      can_read_history:     data.can_read_analytics && data.can_read_history,
    })
  }
}
