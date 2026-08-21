export type UserRole =
  | 'director_general'
  | 'direccion_comercial'
  | 'vendedor'
  | 'marketing'
  | 'administracion'
  | 'soporte_ti'

export type BusinessUnit =
  | 'global_supplier_mty'
  | 'cotizia'
  | 'thunder_safety'
  | 'thunder_led'
  | 'got_fresh_breath'
  | 'gtx_systems'
  | 'juno_promotional'
  | 'fire_spot'

export type OpportunityStage =
  | 'nuevo_lead'
  | 'contactado'
  | 'diagnostico'
  | 'cotizacion_enviada'
  | 'seguimiento'
  | 'negociacion'
  | 'ganado'
  | 'perdido'

export type LeadSource =
  | 'referido'
  | 'meta'
  | 'web'
  | 'linkedin'
  | 'llamada_en_frio'
  | 'evento'
  | 'alianza'
  | 'otro'

export type ActivityType =
  | 'llamada'
  | 'email'
  | 'reunion'
  | 'demo'
  | 'propuesta'
  | 'seguimiento'
  | 'otro'

export type ActivityStatus = 'pendiente' | 'completada' | 'cancelada'

export type Currency = 'MXN' | 'USD'

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  'nuevo_lead',
  'contactado',
  'diagnostico',
  'cotizacion_enviada',
  'seguimiento',
  'negociacion',
  'ganado',
  'perdido',
]

export const CLOSED_STAGES: OpportunityStage[] = ['ganado', 'perdido']

export const BUSINESS_UNITS: BusinessUnit[] = [
  'global_supplier_mty',
  'cotizia',
  'thunder_safety',
  'thunder_led',
  'got_fresh_breath',
  'gtx_systems',
  'juno_promotional',
  'fire_spot',
]

export type ProjectTipo = 'DISENO' | 'INDUSTRIAL'

export type ProjectStatus =
  | 'INCOMING'
  | 'ANALYSIS'
  | 'DESIGN'
  | 'DEVELOPMENT'
  | 'QA'
  | 'DELIVERED'
  | 'ORDEN_COMPRA'
  | 'FACTURACION'
  | 'SEGUIMIENTO'
  | 'CIERRE'

export type ProjectFileType = 'FIGMA' | 'REPO' | 'ASSET' | 'DOC' | 'OTHER'

export const DISENO_STATUSES: ProjectStatus[] = [
  'INCOMING', 'ANALYSIS', 'DESIGN', 'DEVELOPMENT', 'QA', 'DELIVERED',
]

export const INDUSTRIAL_STATUSES: ProjectStatus[] = [
  'INCOMING', 'ORDEN_COMPRA', 'FACTURACION', 'SEGUIMIENTO', 'CIERRE',
]

export function getStatusesForTipo(tipo: ProjectTipo): ProjectStatus[] {
  return tipo === 'INDUSTRIAL' ? INDUSTRIAL_STATUSES : DISENO_STATUSES
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  ...DISENO_STATUSES, 'ORDEN_COMPRA', 'FACTURACION', 'SEGUIMIENTO', 'CIERRE',
]

export const PROJECT_STATUS_ORDER: Record<ProjectStatus, number> = {
  INCOMING: 0, ANALYSIS: 1, DESIGN: 2, DEVELOPMENT: 3, QA: 4, DELIVERED: 5,
  ORDEN_COMPRA: 1, FACTURACION: 2, SEGUIMIENTO: 3, CIERRE: 4,
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  INCOMING:     'Entrante',
  ANALYSIS:     'Análisis',
  DESIGN:       'Diseño',
  DEVELOPMENT:  'Desarrollo',
  QA:           'QA',
  DELIVERED:    'Entregado',
  ORDEN_COMPRA: 'Orden de compra',
  FACTURACION:  'Facturación',
  SEGUIMIENTO:  'Seguimiento',
  CIERRE:       'Cierre y entrega',
}

export const PROJECT_TIPO_LABELS: Record<ProjectTipo, string> = {
  DISENO:     'Diseño / TI',
  INDUSTRIAL: 'Industrial',
}

export const BRAND_LABELS: Record<BusinessUnit, string> = {
  global_supplier_mty: 'Global Supplier MTY',
  cotizia:             'Cotizia',
  thunder_safety:      'Thunder Safety Solutions',
  thunder_led:         'Thunder Led Lights',
  got_fresh_breath:    'Got Fresh Breath',
  gtx_systems:         'GTX Systems',
  juno_promotional:    'Juno Promotional',
  fire_spot:           'The Fire Spot',
}

export const BRAND_COLORS: Record<BusinessUnit, string> = {
  global_supplier_mty: '#16a34a', // verde hoja
  cotizia:             '#8b5cf6', // violeta
  thunder_safety:      '#eab308', // amarillo (tono 1)
  thunder_led:         '#f59e0b', // amarillo (tono 2, distinto)
  got_fresh_breath:    '#3b82f6', // azul
  gtx_systems:         '#1d4ed8', // azul rey
  juno_promotional:    '#6b7280', // gris
  fire_spot:           '#c2410c', // rojo ámbar
}

export const PROJECT_ROLES: UserRole[] = ['marketing', 'director_general', 'administracion']

export const COMISIONES_ROLES: UserRole[] = ['director_general', 'administracion']

export const ADMIN_ROLES: UserRole[] = ['administracion']

export const LEADS_ROLES: UserRole[] = ['marketing', 'director_general', 'direccion_comercial', 'administracion']

export const LEAD_SOURCES: LeadSource[] = [
  'referido', 'meta', 'web', 'linkedin', 'llamada_en_frio', 'evento', 'alianza', 'otro',
]

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  referido:        'Referido',
  meta:             'Meta / Facebook',
  web:              'Sitio web',
  linkedin:         'LinkedIn',
  llamada_en_frio:  'Llamada en frío',
  evento:           'Evento',
  alianza:          'Alianza',
  otro:             'Otro',
}

export const CURRENCIES: Currency[] = ['MXN', 'USD']

export const CURRENCY_LABELS: Record<Currency, string> = {
  MXN: 'MXN — Peso mexicano',
  USD: 'USD — Dólar',
}

export type ITTicketPriority = 'bajo' | 'medio' | 'alto' | 'urgente'
export type ITTicketStatus   = 'abierto' | 'en_proceso' | 'qa_ready' | 'prod_ready' | 'resuelto' | 'cancelado'

export const IT_TICKET_STATUSES: ITTicketStatus[] = [
  'abierto', 'en_proceso', 'qa_ready', 'prod_ready', 'resuelto', 'cancelado',
]

export const IT_TICKET_STATUS_ORDER: Record<ITTicketStatus, number> = {
  abierto: 0, en_proceso: 1, qa_ready: 2, prod_ready: 3, resuelto: 4, cancelado: 5,
}

export const IT_TICKET_STATUS_LABELS: Record<ITTicketStatus, string> = {
  abierto:     'Abierto',
  en_proceso:  'En proceso',
  qa_ready:    'QA Ready',
  prod_ready:  'Prod Ready',
  resuelto:    'Resuelto',
  cancelado:   'Cancelado',
}

// Estados finales: no admiten seguir editando el estado desde el dropdown/kanban
// y, al llegar a ellos, piden confirmación vía modal (ver ITTicketStageTransition
// / ITTicketKanbanBoard).
export const IT_TICKET_TERMINAL_STATUSES: ITTicketStatus[] = ['resuelto', 'cancelado']

export const IT_TICKET_PRIORITIES: ITTicketPriority[] = ['bajo', 'medio', 'alto', 'urgente']

export const IT_TICKET_PRIORITY_ORDER: Record<ITTicketPriority, number> = {
  bajo: 0, medio: 1, alto: 2, urgente: 3,
}

export const IT_TICKET_PRIORITY_LABELS: Record<ITTicketPriority, string> = {
  bajo:    'Bajo',
  medio:   'Medio',
  alto:    'Alto',
  urgente: 'Urgente',
}

// Fuente única de verdad para el KPI "Eficacia" (% de tickets resueltos dentro de SLA).
export const IT_TICKET_SLA_DAYS: Record<ITTicketPriority, number> = {
  urgente: 1,
  alto:    3,
  medio:   7,
  bajo:    14,
}

// Quién puede cambiar prioridad/estado de un ticket (gating de UI — RLS es la seguridad real).
export const IT_STAFF_ROLES: UserRole[] = ['soporte_ti']

// Quién ve la cola completa de tickets + el panel de KPIs.
export const IT_ROLES: UserRole[] = ['soporte_ti', 'director_general', 'administracion']
