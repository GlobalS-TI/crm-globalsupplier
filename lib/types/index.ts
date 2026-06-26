export type UserRole =
  | 'director_general'
  | 'direccion_comercial'
  | 'vendedor'
  | 'marketing'
  | 'administracion'

export type BusinessUnit =
  | 'global_supplier_mty'
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
  thunder_safety:      'Thunder Safety Solutions',
  thunder_led:         'Thunder Led Lights',
  got_fresh_breath:    'Got Fresh Breath',
  gtx_systems:         'GTX Systems',
  juno_promotional:    'Juno Promotional',
  fire_spot:           'The Fire Spot',
}

export const PROJECT_ROLES: UserRole[] = ['marketing', 'director_general', 'administracion']
