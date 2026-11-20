import type { Database } from '@/lib/types/database'
import type { OpportunityFilters, ReportSourceOpportunity } from '@/lib/repositories/interfaces/IOpportunityRepository'
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

// ── Lectura de análisis ──
// Oportunidad de cualquier unidad tal como la devuelve integration_analytics_opportunities.
// email/telefono/celular del contacto vienen null si el cliente no tiene can_read_contact_pii.
export type IntegrationAnalyticsSource = ReportSourceOpportunity & {
  fecha_cierre_estimada: string | null
  notas:                 string | null
  contact: (NonNullable<ReportSourceOpportunity['contact']> & {
    puesto:  string | null
    celular: string | null
  }) | null
}

export interface IntegrationAnalyticsQuery {
  operation: 'analytics_opportunities' | 'analytics_indicators'  // nombre en la bitácora
  filters:   OpportunityFilters
  limit?:    number   // sin limit = todas (indicadores)
  offset?:   number
}

export interface IntegrationAnalyticsPage {
  total: number
  rows:  IntegrationAnalyticsSource[]
}

// ── Historial comercial (sólo lectura, todas las unidades; requiere can_read_history) ──
// Formas tal como las devuelven las funciones integration_history_*. email/telefono/celular
// de contactos vienen null si el cliente no tiene can_read_contact_pii.

export interface IntegrationHistoryActivity {
  id:                     string
  tipo:                   Enums['activity_type']
  estatus:                Enums['activity_status']
  titulo:                 string
  descripcion:            string | null
  fecha:                  string          // cuándo estaba programada
  completed_at:           string | null
  created_at:             string          // cuándo se registró en el CRM
  vendedor:               { id: string; nombre: string | null }   // quien la registró
  creada_por_integracion: boolean
}

export interface IntegrationHistoryActivityRow extends IntegrationHistoryActivity {
  opportunity_id: string
  oportunidad:    string
  business_unit:  Enums['business_unit']
  etapa:          Enums['opportunity_stage']
  company_id:     string | null
  contact_id:     string | null
}

export type IntegrationHistoryOpportunitySource = IntegrationAnalyticsSource & {
  company_id:  string | null
  contact_id:  string | null
  actividades: IntegrationHistoryActivity[]
}

export interface IntegrationHistoryCompany {
  id:         string
  nombre:     string
  rfc:        string | null
  industria:  string | null
  sitio_web:  string | null
  telefono:   string | null
  ciudad:     string | null
  estado:     string | null
  notas:      string | null
  created_at: string
  updated_at: string
}

export interface IntegrationHistoryContact {
  id:         string
  company_id: string | null
  nombre:     string
  apellido:   string | null
  puesto:     string | null
  email:      string | null
  telefono:   string | null
  celular:    string | null
  notas:      string | null
  created_at: string
  updated_at: string
}

export interface IntegrationHistoryOpportunityRef {
  id:            string
  nombre:        string
  business_unit: Enums['business_unit']
  etapa:         Enums['opportunity_stage']
  updated_at:    string
}

export interface IntegrationHistoryCompanyDetail extends IntegrationHistoryCompany {
  contactos:     Pick<IntegrationHistoryContact, 'id' | 'nombre' | 'apellido' | 'puesto'>[]
  oportunidades: IntegrationHistoryOpportunityRef[]
}

export interface IntegrationHistoryContactDetail extends IntegrationHistoryContact {
  oportunidades: IntegrationHistoryOpportunityRef[]
}

export interface IntegrationPage<T> {
  total: number
  rows:  T[]
}

export interface IntegrationHistoryActivityQuery {
  filters: {
    opportunityId?: string
    companyId?:     string
    contactId?:     string
    businessUnit?:  Enums['business_unit']
    tipo?:          Enums['activity_type']
    estatus?:       Enums['activity_status']
    dateField:      'fecha' | 'completed_at' | 'created_at'
    dateFrom?:      string   // ISO, inclusivo
    dateBefore?:    string   // ISO, exclusivo
  }
  limit:  number
  offset: number
}

export interface IntegrationHistoryCompanyQuery {
  q?:     string
  limit:  number
  offset: number
}

export interface IntegrationHistoryContactQuery extends IntegrationHistoryCompanyQuery {
  companyId?: string
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
  // Sólo lectura, todas las unidades; requiere can_read_analytics (lo valida la DB).
  findAnalyticsOpportunities(keyHash: string, query: IntegrationAnalyticsQuery): Promise<IntegrationAnalyticsPage>
  // Historial: sólo lectura, todas las unidades; requiere can_read_history (lo valida la DB).
  findHistoryOpportunity(keyHash: string, id: string): Promise<IntegrationHistoryOpportunitySource>
  findHistoryActivities(keyHash: string, query: IntegrationHistoryActivityQuery): Promise<IntegrationPage<IntegrationHistoryActivityRow>>
  findHistoryCompanies(keyHash: string, query: IntegrationHistoryCompanyQuery): Promise<IntegrationPage<IntegrationHistoryCompany>>
  findHistoryCompany(keyHash: string, id: string): Promise<IntegrationHistoryCompanyDetail>
  findHistoryContacts(keyHash: string, query: IntegrationHistoryContactQuery): Promise<IntegrationPage<IntegrationHistoryContact>>
  findHistoryContact(keyHash: string, id: string): Promise<IntegrationHistoryContactDetail>
}
