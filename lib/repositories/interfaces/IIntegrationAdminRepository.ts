import type { BusinessUnit } from '@/lib/types'
import type { IntegrationPermissionsInput } from '@/lib/validations/integration'

// Vista de administración de integration_clients para la app (sesión del usuario: RLS
// sólo deja leer a director_general y administracion). Nunca expone key_hash.
export interface IntegrationClientSummary {
  id:                     string
  nombre:                 string
  etiqueta:               string
  businessUnit:           BusinessUnit
  keyPrefix:              string | null
  activa:                 boolean   // tiene key emitida y no revocada
  lastUsedAt:             string | null
  canReadAnalytics:       boolean
  canReadContactPii:      boolean
  permissionsUpdatedAt:   string | null
  permissionsUpdatedBy:   string | null   // nombre de quien hizo el último cambio
}

export interface IIntegrationAdminRepository {
  findClients(): Promise<IntegrationClientSummary[]>
  // Pasa por integration_set_permissions(): la DB revalida el rol y registra quién cambió.
  updatePermissions(data: IntegrationPermissionsInput): Promise<void>
}
