import type { Database } from '@/lib/types/database'
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

type Tables = Database['public']['Tables']
type Enums  = Database['public']['Enums']

// Error de dominio de la API de integración; el status se traduce tal cual a HTTP.
export class IntegrationError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
    message: string,
    readonly detail?: string,
  ) {
    super(message)
    this.name = 'IntegrationError'
  }
}

export interface IntegrationLookupMatch {
  id:           string
  nombre:       string
  coincidencia: 'rfc' | 'email' | 'telefono'
  autorizado:   boolean
}

export interface IntegrationContactMatch extends IntegrationLookupMatch {
  apellido:   string | null
  company_id: string | null   // null también cuando el contacto no está autorizado
}

export interface IntegrationLookupResult {
  empresas:  IntegrationLookupMatch[]
  contactos: IntegrationContactMatch[]
}

export type IntegrationCompany = Omit<Tables['companies']['Row'], 'owner_id'>
export type IntegrationContact = Omit<Tables['contacts']['Row'], 'owner_id'>

export interface IntegrationActivity {
  id:                     string
  tipo:                   Enums['activity_type']
  estatus:                Enums['activity_status']
  titulo:                 string
  descripcion:            string | null
  fecha:                  string
  completed_at:           string | null
  creada_por_integracion: boolean
}

export interface IntegrationOpportunity {
  id:                    string
  nombre:                string
  business_unit:         Enums['business_unit']
  etapa:                 Enums['opportunity_stage']
  fuente:                Enums['lead_source']
  moneda:                Enums['currency']
  monto_estimado:        number
  tipo_cambio_estimado:  number | null
  monto_final:           number | null
  probabilidad:          number
  fecha_cierre_estimada: string | null
  next_activity_at:      string | null
  last_activity_at:      string
  stale:                 boolean
  notas:                 string | null
  company_id:            string | null
  contact_id:            string | null
  editable:              boolean   // false cuando una persona ya la cerró
  created_at:            string
  updated_at:            string
  actividades:           IntegrationActivity[]
}

// Todas las operaciones reciben el hash SHA-256 de la API key; la DB resuelve el cliente
// y su alcance. No hay operaciones de borrado.
export interface IIntegrationRepository {
  lookup(keyHash: string, query: IntegrationLookupInput): Promise<IntegrationLookupResult>
  findCompany(keyHash: string, id: string): Promise<IntegrationCompany>
  findContact(keyHash: string, id: string): Promise<IntegrationContact>
  createCompany(keyHash: string, data: IntegrationCreateCompanyInput): Promise<IntegrationCompany>
  createContact(keyHash: string, data: IntegrationCreateContactInput): Promise<IntegrationContact>
  findOpportunities(keyHash: string, filters: IntegrationListOpportunitiesInput): Promise<IntegrationOpportunity[]>
  findOpportunity(keyHash: string, id: string): Promise<IntegrationOpportunity>
  createOpportunity(keyHash: string, data: IntegrationCreateOpportunityInput): Promise<IntegrationOpportunity>
  updateOpportunity(keyHash: string, id: string, data: IntegrationUpdateOpportunityInput): Promise<IntegrationOpportunity>
  createActivity(keyHash: string, data: IntegrationCreateActivityInput): Promise<IntegrationOpportunity>
  updateActivity(keyHash: string, id: string, data: IntegrationUpdateActivityInput): Promise<IntegrationOpportunity>
}
