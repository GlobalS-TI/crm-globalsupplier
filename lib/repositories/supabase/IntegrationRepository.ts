import type { PostgrestError } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  IntegrationError,
  type IIntegrationRepository,
  type IntegrationLookupResult,
  type IntegrationCompany,
  type IntegrationContact,
  type IntegrationOpportunity,
} from '@/lib/repositories/interfaces/IIntegrationRepository'
import type {
  IntegrationLookupInput,
  IntegrationCreateCompanyInput,
  IntegrationCreateContactInput,
  IntegrationCreateOpportunityInput,
  IntegrationUpdateOpportunityInput,
  IntegrationListOpportunitiesInput,
  IntegrationCreateActivityInput,
  IntegrationUpdateActivityInput,
} from '@/lib/validations/integration'

// service_role sólo ejecuta las funciones integration_* (ADR-007): cada una autentica el
// hash de la key y aplica el alcance del cliente dentro de la DB. Este cliente nunca toca
// tablas directamente.
// TODO [deuda]: las funciones integration_* no están en lib/types/database.ts. Regenerar con
// `pnpm db:types` tras aplicar 20261027120000_integracion_thoren.sql y quitar este cast.
type UntypedRpc = (
  fn: string,
  args: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: PostgrestError | null }>

const rpc = supabaseAdmin.rpc.bind(supabaseAdmin) as unknown as UntypedRpc

// SQLSTATE propios de la migración (IN4xx) + errores de datos de Postgres → HTTP
const STATUS_BY_CODE: Record<string, IntegrationError['status']> = {
  IN401: 401, IN403: 403, IN404: 404, IN409: 409, IN422: 422, IN429: 429,
  '22P02': 422, // valor inválido para enum/uuid/número
  '22003': 422, // número fuera de rango
  '22007': 422, // fecha inválida
  '22008': 422, // fecha fuera de rango
  '23502': 422, // not null
  '23503': 422, // FK
  '23514': 422, // check constraint
}

async function callIntegration<T>(
  keyHash: string,
  operation: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await rpc(`integration_${operation}`, { p_key_hash: keyHash, ...args })
  if (!error) return data as T

  const status = STATUS_BY_CODE[error.code] ?? 500

  // 401/429 no se registran: no hay cliente válido o sólo inflarían la bitácora.
  if (status !== 401 && status !== 429) {
    await rpc('integration_log_failure', {
      p_key_hash:  keyHash,
      p_operacion: operation,
      p_error:     `${error.code}: ${error.message}`,
    })
  }

  if (status === 500) {
    console.error('[integration]', operation, error)
    throw new IntegrationError(500, 'Error interno')
  }
  throw new IntegrationError(status, error.message, error.details || undefined)
}

export class IntegrationRepository implements IIntegrationRepository {
  lookup(keyHash: string, query: IntegrationLookupInput): Promise<IntegrationLookupResult> {
    return callIntegration(keyHash, 'lookup', {
      p_rfc:      query.rfc ?? null,
      p_email:    query.email ?? null,
      p_telefono: query.telefono ?? null,
    })
  }

  findCompany(keyHash: string, id: string): Promise<IntegrationCompany> {
    return callIntegration(keyHash, 'get_company', { p_company_id: id })
  }

  findContact(keyHash: string, id: string): Promise<IntegrationContact> {
    return callIntegration(keyHash, 'get_contact', { p_contact_id: id })
  }

  createCompany(keyHash: string, data: IntegrationCreateCompanyInput): Promise<IntegrationCompany> {
    return callIntegration(keyHash, 'create_company', { p_data: data })
  }

  createContact(keyHash: string, data: IntegrationCreateContactInput): Promise<IntegrationContact> {
    return callIntegration(keyHash, 'create_contact', { p_data: data })
  }

  findOpportunities(keyHash: string, filters: IntegrationListOpportunitiesInput): Promise<IntegrationOpportunity[]> {
    return callIntegration(keyHash, 'list_opportunities', { p_etapa: filters.etapa ?? null })
  }

  findOpportunity(keyHash: string, id: string): Promise<IntegrationOpportunity> {
    return callIntegration(keyHash, 'get_opportunity', { p_opp_id: id })
  }

  createOpportunity(keyHash: string, data: IntegrationCreateOpportunityInput): Promise<IntegrationOpportunity> {
    return callIntegration(keyHash, 'create_opportunity', { p_data: data })
  }

  updateOpportunity(keyHash: string, id: string, data: IntegrationUpdateOpportunityInput): Promise<IntegrationOpportunity> {
    return callIntegration(keyHash, 'update_opportunity', { p_opp_id: id, p_data: data })
  }

  createActivity(keyHash: string, data: IntegrationCreateActivityInput): Promise<IntegrationOpportunity> {
    return callIntegration(keyHash, 'create_activity', { p_data: data })
  }

  updateActivity(keyHash: string, id: string, data: IntegrationUpdateActivityInput): Promise<IntegrationOpportunity> {
    return callIntegration(keyHash, 'update_activity', { p_activity_id: id, p_data: data })
  }
}
