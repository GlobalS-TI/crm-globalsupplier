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

export type ProjectStatus =
  | 'INCOMING'
  | 'ANALYSIS'
  | 'DESIGN'
  | 'DEVELOPMENT'
  | 'QA'
  | 'DELIVERED'

export type ProjectFileType = 'FIGMA' | 'REPO' | 'ASSET' | 'DOC' | 'OTHER'

export const PROJECT_STATUSES: ProjectStatus[] = [
  'INCOMING', 'ANALYSIS', 'DESIGN', 'DEVELOPMENT', 'QA', 'DELIVERED',
]

export const PROJECT_STATUS_ORDER: Record<ProjectStatus, number> = {
  INCOMING: 0, ANALYSIS: 1, DESIGN: 2, DEVELOPMENT: 3, QA: 4, DELIVERED: 5,
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  INCOMING:    'Incoming',
  ANALYSIS:    'Analysis',
  DESIGN:      'Design',
  DEVELOPMENT: 'Development',
  QA:          'QA',
  DELIVERED:   'Delivered',
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
