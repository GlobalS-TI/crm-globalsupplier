import { createClient } from '@/lib/supabase/server'
import type {
  IIntegrationAdminRepository,
  IntegrationClientSummary,
} from '@/lib/repositories/interfaces/IIntegrationAdminRepository'
import type { IntegrationPermissionsInput } from '@/lib/validations/integration'

const SUMMARY_COLUMNS = `
  id, nombre, etiqueta, business_unit, key_prefix, revoked_at, last_used_at,
  can_read_analytics, can_read_contact_pii, permissions_updated_at,
  updated_by:profiles!integration_clients_permissions_updated_by_fkey(full_name)
`

export class IntegrationAdminRepository implements IIntegrationAdminRepository {
  async findClients(): Promise<IntegrationClientSummary[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('integration_clients')
      .select(SUMMARY_COLUMNS)
      .order('nombre')

    if (error) throw error
    return (data ?? []).map(c => ({
      id:                   c.id,
      nombre:               c.nombre,
      etiqueta:             c.etiqueta,
      businessUnit:         c.business_unit,
      keyPrefix:            c.key_prefix,
      // integration_issue_key() llena key_prefix junto con el hash: no hace falta leer el hash.
      activa:               c.key_prefix !== null && c.revoked_at === null,
      lastUsedAt:           c.last_used_at,
      canReadAnalytics:     c.can_read_analytics,
      canReadContactPii:    c.can_read_contact_pii,
      permissionsUpdatedAt: c.permissions_updated_at,
      permissionsUpdatedBy: (c.updated_by as { full_name: string } | null)?.full_name ?? null,
    }))
  }

  async updatePermissions(data: IntegrationPermissionsInput): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.rpc('integration_set_permissions', {
      p_client_id:            data.client_id,
      p_can_read_analytics:   data.can_read_analytics,
      p_can_read_contact_pii: data.can_read_contact_pii,
    })
    if (error) throw error
  }
}
