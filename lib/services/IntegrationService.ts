import type {
  IIntegrationRepository,
  IntegrationLookupResult,
  IntegrationCompany,
  IntegrationContact,
  IntegrationOpportunity,
  IntegrationAnalyticsSource,
} from '@/lib/repositories/interfaces/IIntegrationRepository'
import type { BusinessUnit, Currency, LeadSource, OpportunityStage } from '@/lib/types'
import type { ReportStatus } from '@/lib/validations/report'
import type { FollowUpStatus } from '@/lib/utils/followUp'
import {
  toRepositoryFilters,
  toReportRow,
  computeIndicators,
  type OpportunityReportIndicators,
} from '@/lib/services/OpportunityReportService'
import {
  integrationIdSchema,
  integrationLookupSchema,
  integrationCreateCompanySchema,
  integrationCreateContactSchema,
  integrationCreateOpportunitySchema,
  integrationUpdateOpportunitySchema,
  integrationListOpportunitiesSchema,
  integrationCreateActivitySchema,
  integrationUpdateActivitySchema,
  integrationAnalyticsFiltersSchema,
  integrationAnalyticsListSchema,
} from '@/lib/validations/integration'

// Forma pública de una oportunidad en la lectura de análisis (snake_case, como el resto
// de /api/integrations/v1). estado/seguimiento/sin_actividad salen de la misma lógica de
// /reportes (toReportRow), así que THÖREN ve lo mismo que la pantalla.
export interface IntegrationAnalyticsOpportunity {
  id:                         string
  nombre:                     string
  business_unit:              BusinessUnit
  etapa:                      OpportunityStage
  estado:                     ReportStatus
  seguimiento:                FollowUpStatus | null
  sin_actividad:              boolean
  fuente:                     LeadSource
  probabilidad:               number
  moneda:                     Currency
  monto_estimado:             number
  monto_estimado_mxn:         number
  monto_final_mxn:            number | null
  fecha_cierre_estimada:      string | null
  created_at:                 string
  last_completed_activity_at: string | null
  next_activity_at:           string | null
  closed_at:                  string | null
  notas:                      string | null
  empresa:                    string | null
  contacto: {
    nombre:   string
    puesto:   string | null
    email:    string | null   // null salvo can_read_contact_pii
    telefono: string | null
    celular:  string | null
  } | null
  vendedor: { id: string; nombre: string | null }
}

export interface IntegrationAnalyticsList {
  total:         number
  limit:         number
  offset:        number
  oportunidades: IntegrationAnalyticsOpportunity[]
}

export interface IntegrationAnalyticsIndicators {
  total:       number
  indicadores: OpportunityReportIndicators
}

function toAnalyticsOpportunity(opp: IntegrationAnalyticsSource, now: Date): IntegrationAnalyticsOpportunity {
  const row = toReportRow(opp, now)
  return {
    id:                         row.id,
    nombre:                     row.oportunidad,
    business_unit:              row.unidad,
    etapa:                      row.etapa,
    estado:                     row.estado,
    seguimiento:                row.seguimiento,
    sin_actividad:              row.sinActividad,
    fuente:                     row.origen,
    probabilidad:               row.probabilidad,
    moneda:                     row.moneda,
    monto_estimado:             row.montoEstimado,
    monto_estimado_mxn:         row.montoEstimadoMxn,
    monto_final_mxn:            row.montoFinalMxn,
    fecha_cierre_estimada:      opp.fecha_cierre_estimada,
    created_at:                 row.creadaEl,
    last_completed_activity_at: row.ultimaActividadEl,
    next_activity_at:           row.proximoSeguimientoEl,
    closed_at:                  row.cerradaEl,
    notas:                      opp.notas,
    empresa:                    row.empresa,
    contacto: opp.contact && {
      nombre:   row.contacto ?? opp.contact.nombre,
      puesto:   opp.contact.puesto,
      email:    opp.contact.email,
      telefono: opp.contact.telefono,
      celular:  opp.contact.celular,
    },
    vendedor: { id: row.vendedorId, nombre: row.vendedor },
  }
}

// API de integración externa (ADR-007). El alcance (unidad, dueño, etapas, registros
// autorizados) lo aplica la DB por cliente; aquí sólo se valida la forma de los datos.
export class IntegrationService {
  constructor(private readonly repo: IIntegrationRepository) {}

  async findDuplicates(keyHash: string, raw: unknown): Promise<IntegrationLookupResult> {
    return this.repo.lookup(keyHash, integrationLookupSchema.parse(raw))
  }

  async getCompany(keyHash: string, id: string): Promise<IntegrationCompany> {
    return this.repo.findCompany(keyHash, integrationIdSchema.parse(id))
  }

  async getContact(keyHash: string, id: string): Promise<IntegrationContact> {
    return this.repo.findContact(keyHash, integrationIdSchema.parse(id))
  }

  async createCompany(keyHash: string, raw: unknown): Promise<IntegrationCompany> {
    return this.repo.createCompany(keyHash, integrationCreateCompanySchema.parse(raw))
  }

  async createContact(keyHash: string, raw: unknown): Promise<IntegrationContact> {
    return this.repo.createContact(keyHash, integrationCreateContactSchema.parse(raw))
  }

  async listOpportunities(keyHash: string, raw: unknown): Promise<IntegrationOpportunity[]> {
    return this.repo.findOpportunities(keyHash, integrationListOpportunitiesSchema.parse(raw))
  }

  async getOpportunity(keyHash: string, id: string): Promise<IntegrationOpportunity> {
    return this.repo.findOpportunity(keyHash, integrationIdSchema.parse(id))
  }

  async createOpportunity(keyHash: string, raw: unknown): Promise<IntegrationOpportunity> {
    return this.repo.createOpportunity(keyHash, integrationCreateOpportunitySchema.parse(raw))
  }

  async updateOpportunity(keyHash: string, id: string, raw: unknown): Promise<IntegrationOpportunity> {
    return this.repo.updateOpportunity(
      keyHash,
      integrationIdSchema.parse(id),
      integrationUpdateOpportunitySchema.parse(raw),
    )
  }

  async createActivity(keyHash: string, raw: unknown): Promise<IntegrationOpportunity> {
    return this.repo.createActivity(keyHash, integrationCreateActivitySchema.parse(raw))
  }

  async updateActivity(keyHash: string, id: string, raw: unknown): Promise<IntegrationOpportunity> {
    return this.repo.updateActivity(
      keyHash,
      integrationIdSchema.parse(id),
      integrationUpdateActivitySchema.parse(raw),
    )
  }

  // ── Lectura de análisis: sólo lectura, todas las unidades ──
  // Aunque los filtros se contradigan (stages: []) se consulta igual: la DB autentica,
  // valida el permiso y registra la llamada; un atajo aquí devolvería 200 sin key válida.

  async listAnalyticsOpportunities(keyHash: string, raw: unknown, now: Date = new Date()): Promise<IntegrationAnalyticsList> {
    const { limit, offset, ...filters } = integrationAnalyticsListSchema.parse(raw)
    const page = await this.repo.findAnalyticsOpportunities(keyHash, {
      operation: 'analytics_opportunities',
      filters:   toRepositoryFilters(filters, now),
      limit,
      offset,
    })
    return {
      total:         page.total,
      limit,
      offset,
      oportunidades: page.rows.map(o => toAnalyticsOpportunity(o, now)),
    }
  }

  async getAnalyticsIndicators(keyHash: string, raw: unknown, now: Date = new Date()): Promise<IntegrationAnalyticsIndicators> {
    const filters = integrationAnalyticsFiltersSchema.parse(raw)
    const page = await this.repo.findAnalyticsOpportunities(keyHash, {
      operation: 'analytics_indicators',
      filters:   toRepositoryFilters(filters, now),
    })
    return {
      total:       page.total,
      indicadores: computeIndicators(page.rows.map(o => toReportRow(o, now))),
    }
  }
}
