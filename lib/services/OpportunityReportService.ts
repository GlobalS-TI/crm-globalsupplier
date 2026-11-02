import type { IOpportunityRepository, OpportunityFilters, OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'
import type { BusinessUnit, Currency, LeadSource, OpportunityStage } from '@/lib/types'
import { CLOSED_STAGES, OPPORTUNITY_STAGES } from '@/lib/types'
import { opportunityReportFiltersSchema } from '@/lib/validations/report'
import type { OpportunityReportFilters, ReportAlert, ReportStatus } from '@/lib/validations/report'
import { resolveFollowUpStatus, type FollowUpStatus } from '@/lib/utils/followUp'
import { businessDayKey, businessDayStartISO, nextDayKey } from '@/lib/utils/date'

const OPEN_STAGES = OPPORTUNITY_STAGES.filter(s => !CLOSED_STAGES.includes(s))

const STATUS_STAGES: Record<ReportStatus, OpportunityStage[]> = {
  abierta:       OPEN_STAGES,
  ganada:        ['ganado'],
  perdida:       ['perdido'],
  sin_respuesta: ['sin_respuesta'],
}

const ALERT_STAGES: Record<ReportAlert, OpportunityStage[]> = {
  sin_seguimiento:      OPEN_STAGES,
  seguimiento_vencido:  OPEN_STAGES,
  sin_actividad:        OPEN_STAGES,
  cotizacion_pendiente: ['cotizacion_enviada'],
}

const STAGE_STATUS: Record<OpportunityStage, ReportStatus> = {
  nuevo_lead: 'abierta', contactado: 'abierta', diagnostico: 'abierta',
  cotizacion_enviada: 'abierta', seguimiento: 'abierta', negociacion: 'abierta',
  ganado: 'ganada', perdido: 'perdida', sin_respuesta: 'sin_respuesta',
}

export type OpportunityReportRow = {
  id:                   string
  oportunidad:          string
  empresa:              string | null
  contacto:             string | null
  contactoEmail:        string | null
  contactoTelefono:     string | null
  unidad:               BusinessUnit
  vendedor:             string | null
  etapa:                OpportunityStage
  montoEstimado:        number
  moneda:               Currency
  montoEstimadoMxn:     number
  creadaEl:             string
  ultimaActividadEl:    string
  proximoSeguimientoEl: string | null
  estado:               ReportStatus
  seguimiento:          FollowUpStatus | null  // null en oportunidades cerradas
  sinActividad:         boolean
  origen:               LeadSource
}

export type OpportunityReportSummary = {
  count:             number
  montoEstimadoMxn:  number
}

/**
 * Traduce los filtros del reporte a filtros del repositorio. Etapa, estado y alerta
 * restringen la etapa cada uno por su lado; se combinan por intersección, así que una
 * combinación contradictoria (p. ej. estado "ganada" + alerta "sin seguimiento") da
 * `stages: []`, que significa "sin resultados".
 */
export function toRepositoryFilters(filters: OpportunityReportFilters, now: Date): OpportunityFilters {
  const stageSets = [
    filters.stage  ? [filters.stage] : null,
    filters.estado ? STATUS_STAGES[filters.estado] : null,
    filters.alerta ? ALERT_STAGES[filters.alerta] : null,
  ].filter((s): s is OpportunityStage[] => s !== null)

  const stages = stageSets.length > 0
    ? stageSets.reduce((acc, set) => acc.filter(s => set.includes(s)))
    : undefined

  return {
    ...(filters.owner  && { ownerId:      filters.owner }),
    ...(filters.unit   && { businessUnit: filters.unit }),
    ...(stages         && { stages }),
    ...(filters.desde  && { createdFrom:   businessDayStartISO(filters.desde) }),
    ...(filters.hasta  && { createdBefore: businessDayStartISO(nextDayKey(filters.hasta)) }),
    ...(filters.alerta === 'sin_seguimiento'     && { nextActivityMissing: true }),
    ...(filters.alerta === 'seguimiento_vencido' && { nextActivityBefore: businessDayStartISO(businessDayKey(now)) }),
    ...(filters.alerta === 'sin_actividad'       && { stale: true }),
  }
}

export function toReportRow(opp: OpportunityWithRelations, now: Date): OpportunityReportRow {
  const estado  = STAGE_STATUS[opp.etapa]
  const contact = opp.contact
    ? [opp.contact.nombre, opp.contact.apellido].filter(Boolean).join(' ')
    : null

  return {
    id:                   opp.id,
    oportunidad:          opp.nombre,
    empresa:              opp.company?.nombre ?? null,
    contacto:             contact,
    contactoEmail:        opp.contact?.email ?? null,
    contactoTelefono:     opp.contact?.telefono ?? null,
    unidad:               opp.business_unit,
    vendedor:             opp.owner?.full_name ?? null,
    etapa:                opp.etapa,
    montoEstimado:        Number(opp.monto_estimado),
    moneda:               opp.moneda,
    montoEstimadoMxn:     Number(opp.monto_estimado_mxn ?? opp.monto_estimado),
    creadaEl:             opp.created_at,
    ultimaActividadEl:    opp.last_activity_at,
    proximoSeguimientoEl: opp.next_activity_at,
    estado,
    seguimiento:          estado === 'abierta' ? resolveFollowUpStatus(opp.next_activity_at, now) : null,
    sinActividad:         opp.stale,
    origen:               opp.fuente,
  }
}

export function summarizeReport(rows: OpportunityReportRow[]): OpportunityReportSummary {
  return {
    count:            rows.length,
    montoEstimadoMxn: rows.reduce((sum, r) => sum + r.montoEstimadoMxn, 0),
  }
}

export class OpportunityReportService {
  constructor(private readonly repo: IOpportunityRepository) {}

  // Lo que cada quien ve lo decide RLS (ADR-003): un vendedor sólo recibe las suyas
  // aunque pida otro `owner`.
  async listOpportunities(rawFilters: unknown, now: Date = new Date()): Promise<OpportunityReportRow[]> {
    const filters     = opportunityReportFiltersSchema.parse(rawFilters ?? {})
    const repoFilters = toRepositoryFilters(filters, now)
    if (repoFilters.stages?.length === 0) return []

    const opps = await this.repo.findAll(repoFilters)
    return opps.map(o => toReportRow(o, now))
  }
}
