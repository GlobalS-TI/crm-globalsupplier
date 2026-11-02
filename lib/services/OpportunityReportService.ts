import type { IOpportunityRepository, OpportunityFilters, OpportunityWithRelations } from '@/lib/repositories/interfaces/IOpportunityRepository'
import type { BusinessUnit, Currency, LeadSource, OpportunityStage } from '@/lib/types'
import { BRAND_LABELS, CLOSED_STAGES, OPPORTUNITY_STAGES } from '@/lib/types'
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
  vendedorId:           string
  vendedor:             string | null
  etapa:                OpportunityStage
  probabilidad:         number
  montoEstimado:        number
  moneda:               Currency
  montoEstimadoMxn:     number
  montoFinalMxn:        number | null
  creadaEl:             string
  ultimaActividadEl:    string | null  // última actividad COMPLETADA; null si no hay
  proximoSeguimientoEl: string | null
  cerradaEl:            string | null
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

  const from   = filters.desde ? businessDayStartISO(filters.desde) : undefined
  const before = filters.hasta ? businessDayStartISO(nextDayKey(filters.hasta)) : undefined
  const byClose = filters.fecha === 'cierre'

  return {
    ...(filters.owner  && { ownerId:      filters.owner }),
    ...(filters.unit   && { businessUnit: filters.unit }),
    ...(stages         && { stages }),
    ...(from   && (byClose ? { closedFrom:   from }   : { createdFrom:   from })),
    ...(before && (byClose ? { closedBefore: before } : { createdBefore: before })),
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
    vendedorId:           opp.owner_id,
    vendedor:             opp.owner?.full_name ?? null,
    etapa:                opp.etapa,
    probabilidad:         opp.probabilidad,
    montoEstimado:        Number(opp.monto_estimado),
    moneda:               opp.moneda,
    montoEstimadoMxn:     Number(opp.monto_estimado_mxn ?? opp.monto_estimado),
    montoFinalMxn:        opp.monto_final_mxn === null ? null : Number(opp.monto_final_mxn),
    creadaEl:             opp.created_at,
    ultimaActividadEl:    opp.last_completed_activity_at,
    proximoSeguimientoEl: opp.next_activity_at,
    cerradaEl:            opp.closed_at,
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

// ── Indicadores ──────────────────────────────────────────────────
// Se calculan sobre las mismas filas filtradas del detalle, así que siempre cuadran
// con lo que se ve y se exporta. Montos en MXN (equivalente para USD).

export type IndicatorBreakdown = {
  key:          string
  label:        string
  abiertas:     number
  pipelineMxn:  number  // monto estimado de las abiertas
  ponderadoMxn: number  // pipeline × probabilidad
  ganadas:      number
  ganadoMxn:    number  // monto final de las ganadas
  perdidas:     number  // perdido + sin_respuesta
  conversion:   number | null  // ganadas ÷ cerradas; null si no hay cerradas
}

export type OpportunityReportIndicators = {
  abiertas:              { count: number; pipelineMxn: number; ponderadoMxn: number }
  cotizacionesEnviadas:  { count: number; montoMxn: number }
  sinSeguimiento:        number
  seguimientosVencidos:  number
  sinActividad:          number
  ganadas:               { count: number; montoMxn: number }
  perdidas:              { count: number; sinRespuesta: number; montoMxn: number }
  conversion:            number | null
  porUnidad:             IndicatorBreakdown[]
  porVendedor:           IndicatorBreakdown[]
}

function emptyBreakdown(key: string, label: string): IndicatorBreakdown {
  return { key, label, abiertas: 0, pipelineMxn: 0, ponderadoMxn: 0, ganadas: 0, ganadoMxn: 0, perdidas: 0, conversion: null }
}

function addToBreakdown(b: IndicatorBreakdown, row: OpportunityReportRow): void {
  if (row.estado === 'abierta') {
    b.abiertas     += 1
    b.pipelineMxn  += row.montoEstimadoMxn
    b.ponderadoMxn += row.montoEstimadoMxn * (row.probabilidad / 100)
  } else if (row.estado === 'ganada') {
    b.ganadas   += 1
    b.ganadoMxn += row.montoFinalMxn ?? 0
  } else {
    b.perdidas += 1
  }
}

function conversionRate(ganadas: number, perdidas: number): number | null {
  const cerradas = ganadas + perdidas
  return cerradas === 0 ? null : ganadas / cerradas
}

function groupBreakdown(
  rows: OpportunityReportRow[],
  keyOf: (r: OpportunityReportRow) => { key: string; label: string },
): IndicatorBreakdown[] {
  const groups = new Map<string, IndicatorBreakdown>()
  for (const row of rows) {
    const { key, label } = keyOf(row)
    const group = groups.get(key) ?? emptyBreakdown(key, label)
    addToBreakdown(group, row)
    groups.set(key, group)
  }
  return Array.from(groups.values())
    .map(g => ({ ...g, conversion: conversionRate(g.ganadas, g.perdidas) }))
    .sort((a, b) => b.pipelineMxn - a.pipelineMxn || b.ganadoMxn - a.ganadoMxn)
}

export function computeIndicators(rows: OpportunityReportRow[]): OpportunityReportIndicators {
  const total    = emptyBreakdown('total', 'Total')
  const abiertas = rows.filter(r => r.estado === 'abierta')
  const quotes   = abiertas.filter(r => r.etapa === 'cotizacion_enviada')
  for (const row of rows) addToBreakdown(total, row)

  return {
    abiertas:             { count: total.abiertas, pipelineMxn: total.pipelineMxn, ponderadoMxn: total.ponderadoMxn },
    cotizacionesEnviadas: { count: quotes.length, montoMxn: quotes.reduce((s, r) => s + r.montoEstimadoMxn, 0) },
    sinSeguimiento:       abiertas.filter(r => r.seguimiento === 'sin_seguimiento').length,
    seguimientosVencidos: abiertas.filter(r => r.seguimiento === 'vencida').length,
    sinActividad:         abiertas.filter(r => r.sinActividad).length,
    ganadas:              { count: total.ganadas, montoMxn: total.ganadoMxn },
    perdidas: {
      count:        total.perdidas,
      sinRespuesta: rows.filter(r => r.estado === 'sin_respuesta').length,
      montoMxn:     rows.filter(r => r.estado === 'perdida' || r.estado === 'sin_respuesta')
                        .reduce((s, r) => s + r.montoEstimadoMxn, 0),
    },
    conversion:  conversionRate(total.ganadas, total.perdidas),
    porUnidad:   groupBreakdown(rows, r => ({ key: r.unidad, label: BRAND_LABELS[r.unidad] })),
    porVendedor: groupBreakdown(rows, r => ({ key: r.vendedorId, label: r.vendedor ?? 'Sin asignar' })),
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
