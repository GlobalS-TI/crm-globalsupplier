'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { QuoteRepository } from '@/lib/repositories/supabase/QuoteRepository'
import { OrderRepository } from '@/lib/repositories/supabase/OrderRepository'
import { InvoiceRepository } from '@/lib/repositories/supabase/InvoiceRepository'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { QuoteService } from '@/lib/services/QuoteService'
import { OrderService } from '@/lib/services/OrderService'
import { InvoiceService } from '@/lib/services/InvoiceService'

function makeQuoteService() {
  return new QuoteService(new QuoteRepository(), new OpportunityRepository())
}

function makeOrderService() {
  return new OrderService(new OrderRepository(), new QuoteRepository())
}

function makeInvoiceService() {
  return new InvoiceService(new InvoiceRepository(), new OrderRepository())
}

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

function revalidateOpportunity(opportunityId: string) {
  revalidatePath(`/oportunidades/${opportunityId}`)
}

// ----------------------------------------------------------------
// Quotes
// ----------------------------------------------------------------
export async function createQuote(
  opportunityId: string,
  input: { document_url?: string; external_ref?: string; notas?: string },
): Promise<{ error?: string }> {
  try {
    const userId = await getCurrentUserId()
    await makeQuoteService().create({ opportunity_id: opportunityId, ...input }, userId)
    revalidateOpportunity(opportunityId)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateQuoteStatus(
  opportunityId: string,
  quoteId: string,
  status: 'borrador' | 'enviada' | 'aceptada' | 'rechazada',
): Promise<{ error?: string }> {
  try {
    await makeQuoteService().updateStatus(quoteId, { status })
    revalidateOpportunity(opportunityId)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ----------------------------------------------------------------
// Orders
// ----------------------------------------------------------------
export async function createOrder(
  opportunityId: string,
  quoteId: string,
  input: { document_url?: string; external_ref?: string; notas?: string },
): Promise<{ error?: string }> {
  try {
    const userId = await getCurrentUserId()
    await makeOrderService().create({ opportunity_id: opportunityId, quote_id: quoteId, ...input }, userId)
    revalidateOpportunity(opportunityId)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateOrderStatus(
  opportunityId: string,
  orderId: string,
  status: 'revision_cliente' | 'aprobado' | 'cancelado',
): Promise<{ error?: string }> {
  try {
    await makeOrderService().updateStatus(orderId, { status })
    revalidateOpportunity(opportunityId)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function addOrderProvider(
  opportunityId: string,
  orderId: string,
  proveedor: string,
  monto?: number,
  notas?: string,
): Promise<{ error?: string }> {
  try {
    await makeOrderService().addProvider({ order_id: orderId, proveedor, monto, notas })
    revalidateOpportunity(opportunityId)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function removeOrderProvider(
  opportunityId: string,
  providerId: string,
): Promise<{ error?: string }> {
  try {
    await makeOrderService().removeProvider(providerId)
    revalidateOpportunity(opportunityId)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

// ----------------------------------------------------------------
// Invoices
// ----------------------------------------------------------------
export async function createInvoice(
  opportunityId: string,
  orderId: string,
  input: { folio?: string; monto?: number; document_url?: string },
): Promise<{ error?: string }> {
  try {
    const userId = await getCurrentUserId()
    await makeInvoiceService().create({ order_id: orderId, ...input }, userId)
    revalidateOpportunity(opportunityId)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}
