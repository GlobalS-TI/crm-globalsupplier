import type { Database } from '@/lib/types/database'
import type { CreateQuoteInput, UpdateQuoteInput } from '@/lib/validations/quote'

export type QuoteRow = Database['public']['Tables']['quotes']['Row']

export interface IQuoteRepository {
  findById(id: string): Promise<QuoteRow | null>
  findByOpportunity(opportunityId: string): Promise<QuoteRow[]>
  create(data: CreateQuoteInput, createdBy: string, version: number): Promise<QuoteRow>
  update(id: string, data: UpdateQuoteInput): Promise<QuoteRow>
  delete(id: string): Promise<void>
}
