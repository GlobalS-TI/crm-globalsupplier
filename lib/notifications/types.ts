import type { ITTicketStatus } from '@/lib/types'

export type NotificationType =
  | 'stale_digest'
  | 'lead_assigned'
  | 'opp_ganada'
  | 'opp_perdida'
  | 'lead_converted'
  | 'opportunity_assigned'
  | 'it_ticket_assigned'
  | 'it_ticket_status_changed'
  | 'it_ticket_message'

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

export interface OpportunityAssignedPayload {
  opp_id:     string
  opp_nombre: string
  lead_name:  string
}

export interface ITTicketAssignedPayload {
  ticket_id:       string
  ticket_title:    string
  requester_name:  string
}

export interface ITTicketStatusChangedPayload {
  ticket_id:    string
  ticket_title: string
  status:       ITTicketStatus
  changed_by:   string
}

export interface ITTicketMessagePayload {
  ticket_id:    string
  ticket_title: string
  author_name:  string
}

export type NotificationPayload =
  | StaleDigestPayload
  | LeadAssignedPayload
  | OppClosedPayload
  | LeadConvertedPayload
  | OpportunityAssignedPayload
  | ITTicketAssignedPayload
  | ITTicketStatusChangedPayload
  | ITTicketMessagePayload
