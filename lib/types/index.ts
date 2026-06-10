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
