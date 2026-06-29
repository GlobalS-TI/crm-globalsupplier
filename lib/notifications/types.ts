export type NotificationType =
  | 'stale_digest'
  | 'lead_assigned'
  | 'opp_ganada'
  | 'opp_perdida'
  | 'lead_converted'

export interface NotificationRow {
  id:            string
  recipient_id:  string
  type:          NotificationType
  title:         string
  body:          string
  href:          string | null
  read_at:       string | null
  email_sent_at: string | null
  email_error:   string | null
  payload:       Record<string, unknown>
  created_at:    string
}

// Payloads tipados por evento
export interface StaleDigestPayload {
  count: number
  opp_names: string[]
}

export interface LeadAssignedPayload {
  lead_id:   string
  lead_name: string
  section:   string
}

export interface OppClosedPayload {
  opp_id:     string
  opp_nombre: string
  etapa:      'ganado' | 'perdido'
  vendedor:   string
  monto?:     number
}

export interface LeadConvertedPayload {
  lead_id:    string
  lead_name:  string
  opp_id:     string
  opp_nombre: string
}

export type NotificationPayload =
  | StaleDigestPayload
  | LeadAssignedPayload
  | OppClosedPayload
  | LeadConvertedPayload
