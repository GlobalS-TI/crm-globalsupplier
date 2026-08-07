'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  createQuote, updateQuoteStatus,
  createOrder, updateOrderStatus, addOrderProvider, removeOrderProvider,
  createInvoice,
} from '@/app/(dashboard)/oportunidades/juno-actions'
import type { QuoteRow } from '@/lib/repositories/interfaces/IQuoteRepository'
import type { OrderRow, OrderProviderRow } from '@/lib/repositories/interfaces/IOrderRepository'
import type { InvoiceRow } from '@/lib/repositories/interfaces/IInvoiceRepository'
import type { QuoteStatus } from '@/lib/validations/quote'
import type { OrderStatus } from '@/lib/validations/order'

const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  borrador: 'Borrador', enviada: 'Enviada', aceptada: 'Aceptada', rechazada: 'Rechazada',
}
const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  revision_cliente: 'Revisión cliente', aprobado: 'Aprobado', cancelado: 'Cancelado',
}

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 })

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function DocLink({ url }: { url: string | null }) {
  if (!url) return <span className="text-muted-foreground italic">sin documento</span>
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
      Documento <ExternalLink className="h-3 w-3" />
    </a>
  )
}

// ----------------------------------------------------------------
// Nueva cotización
// ----------------------------------------------------------------
function NewQuoteForm({ opportunityId, onDone }: { opportunityId: string; onDone: () => void }) {
  const [documentUrl, setDocumentUrl] = useState('')
  const [notas, setNotas]             = useState('')
  const [isPending, startTransition]  = useTransition()
  const { toast } = useToast()

  function submit() {
    startTransition(async () => {
      const res = await createQuote(opportunityId, {
        document_url: documentUrl || undefined,
        notas:        notas || undefined,
      })
      if (res.error) {
        toast({ title: 'Error al crear cotización', description: res.error, variant: 'destructive' })
      } else {
        setDocumentUrl(''); setNotas(''); onDone()
      }
    })
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
      <Input placeholder="URL del documento (PDF/Excel)" value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} />
      <Input placeholder="Notas (opcional)" value={notas} onChange={e => setNotas(e.target.value)} />
      <Button size="sm" onClick={submit} disabled={isPending}>Guardar cotización</Button>
    </div>
  )
}

function QuoteSection({ opportunityId, quotes }: { opportunityId: string; quotes: QuoteRow[] }) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  function onStatusChange(id: string, status: QuoteStatus) {
    startTransition(async () => {
      const res = await updateQuoteStatus(opportunityId, id, status)
      if (res.error) toast({ title: 'Error', description: res.error, variant: 'destructive' })
      else router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Cotizaciones</h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Nueva versión
        </Button>
      </div>

      {showForm && (
        <NewQuoteForm opportunityId={opportunityId} onDone={() => { setShowForm(false); router.refresh() }} />
      )}

      {quotes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin cotizaciones aún.</p>
      ) : (
        <ul className="space-y-2">
          {quotes.map(q => (
            <li key={q.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">v{q.version}</Badge>
                <DocLink url={q.document_url} />
                <span className="text-xs text-muted-foreground">{formatDate(q.created_at)}</span>
              </div>
              <select
                className="text-xs border rounded px-2 py-1 bg-background"
                value={q.status}
                disabled={isPending}
                onChange={e => onStatusChange(q.id, e.target.value as QuoteStatus)}
              >
                {Object.entries(QUOTE_STATUS_LABELS).map(([v, label]) => (
                  <option key={v} value={v}>{label}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// Nuevo pedido
// ----------------------------------------------------------------
function NewOrderForm({ opportunityId, acceptedQuotes, onDone }: {
  opportunityId: string
  acceptedQuotes: QuoteRow[]
  onDone: () => void
}) {
  const [quoteId, setQuoteId]         = useState(acceptedQuotes[0]?.id ?? '')
  const [documentUrl, setDocumentUrl] = useState('')
  const [notas, setNotas]             = useState('')
  const [isPending, startTransition]  = useTransition()
  const { toast } = useToast()

  function submit() {
    if (!quoteId) return
    startTransition(async () => {
      const res = await createOrder(opportunityId, quoteId, {
        document_url: documentUrl || undefined,
        notas:        notas || undefined,
      })
      if (res.error) {
        toast({ title: 'Error al crear pedido', description: res.error, variant: 'destructive' })
      } else {
        setDocumentUrl(''); setNotas(''); onDone()
      }
    })
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
      <select className="w-full text-sm border rounded px-2 py-1.5 bg-background" value={quoteId} onChange={e => setQuoteId(e.target.value)}>
        {acceptedQuotes.map(q => <option key={q.id} value={q.id}>Cotización v{q.version}</option>)}
      </select>
      <Input placeholder="URL del documento (PDF)" value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} />
      <Input placeholder="Notas (opcional)" value={notas} onChange={e => setNotas(e.target.value)} />
      <Button size="sm" onClick={submit} disabled={isPending || !quoteId}>Guardar pedido</Button>
    </div>
  )
}

function ProvidersList({ opportunityId, orderId, providers }: {
  opportunityId: string
  orderId: string
  providers: OrderProviderRow[]
}) {
  const [proveedor, setProveedor]    = useState('')
  const [monto, setMonto]            = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  function add() {
    if (!proveedor.trim()) return
    startTransition(async () => {
      const res = await addOrderProvider(opportunityId, orderId, proveedor.trim(), monto ? Number(monto) : undefined)
      if (res.error) toast({ title: 'Error', description: res.error, variant: 'destructive' })
      else { setProveedor(''); setMonto(''); router.refresh() }
    })
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await removeOrderProvider(opportunityId, id)
      if (res.error) toast({ title: 'Error', description: res.error, variant: 'destructive' })
      else router.refresh()
    })
  }

  return (
    <div className="mt-2 pl-4 border-l-2 space-y-1.5">
      {providers.map(p => (
        <div key={p.id} className="flex items-center justify-between text-xs">
          <span>{p.proveedor}{p.monto != null && <span className="text-muted-foreground"> · {MXN.format(p.monto)}</span>}</span>
          <button onClick={() => remove(p.id)} disabled={isPending} title="Quitar proveedor">
            <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ))}
      <div className="flex gap-1.5 pt-1">
        <Input className="h-7 text-xs" placeholder="Proveedor" value={proveedor} onChange={e => setProveedor(e.target.value)} />
        <Input className="h-7 text-xs w-28" type="number" min={0} placeholder="Monto" value={monto} onChange={e => setMonto(e.target.value)} />
        <Button size="sm" className="h-7 px-2" onClick={add} disabled={isPending || !proveedor.trim()}>+</Button>
      </div>
    </div>
  )
}

function OrderSection({ opportunityId, orders, acceptedQuotes, providersByOrder }: {
  opportunityId: string
  orders: OrderRow[]
  acceptedQuotes: QuoteRow[]
  providersByOrder: Record<string, OrderProviderRow[]>
}) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { toast } = useToast()

  function onStatusChange(id: string, status: OrderStatus) {
    startTransition(async () => {
      const res = await updateOrderStatus(opportunityId, id, status)
      if (res.error) toast({ title: 'Error', description: res.error, variant: 'destructive' })
      else router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Pedidos</h3>
        {acceptedQuotes.length > 0 && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(v => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Nueva versión
          </Button>
        )}
      </div>

      {acceptedQuotes.length === 0 && orders.length === 0 && (
        <p className="text-sm text-muted-foreground">Requiere una cotización aceptada.</p>
      )}

      {showForm && (
        <NewOrderForm
          opportunityId={opportunityId}
          acceptedQuotes={acceptedQuotes}
          onDone={() => { setShowForm(false); router.refresh() }}
        />
      )}

      {orders.length > 0 && (
        <ul className="space-y-3">
          {orders.map(o => (
            <li key={o.id} className="border rounded-md px-3 py-2 text-sm space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">v{o.version}</Badge>
                  <DocLink url={o.document_url} />
                  <span className="text-xs text-muted-foreground">{formatDate(o.created_at)}</span>
                </div>
                <select
                  className="text-xs border rounded px-2 py-1 bg-background"
                  value={o.status}
                  disabled={isPending}
                  onChange={e => onStatusChange(o.id, e.target.value as OrderStatus)}
                >
                  {Object.entries(ORDER_STATUS_LABELS).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
              <ProvidersList opportunityId={opportunityId} orderId={o.id} providers={providersByOrder[o.id] ?? []} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// Facturación (opcional)
// ----------------------------------------------------------------
function NewInvoiceForm({ opportunityId, orderId, onDone }: { opportunityId: string; orderId: string; onDone: () => void }) {
  const [folio, setFolio]            = useState('')
  const [monto, setMonto]            = useState('')
  const [documentUrl, setDocumentUrl] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  function submit() {
    startTransition(async () => {
      const res = await createInvoice(opportunityId, orderId, {
        folio:        folio || undefined,
        monto:        monto ? Number(monto) : undefined,
        document_url: documentUrl || undefined,
      })
      if (res.error) toast({ title: 'Error al registrar factura', description: res.error, variant: 'destructive' })
      else { setFolio(''); setMonto(''); setDocumentUrl(''); onDone() }
    })
  }

  return (
    <div className="flex gap-1.5 pt-1">
      <Input className="h-7 text-xs" placeholder="Folio" value={folio} onChange={e => setFolio(e.target.value)} />
      <Input className="h-7 text-xs w-24" type="number" min={0} placeholder="Monto" value={monto} onChange={e => setMonto(e.target.value)} />
      <Input className="h-7 text-xs" placeholder="URL" value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} />
      <Button size="sm" className="h-7 px-2 shrink-0" onClick={submit} disabled={isPending}>Registrar</Button>
    </div>
  )
}

function InvoiceSection({ opportunityId, approvedOrders, invoicesByOrder }: {
  opportunityId: string
  approvedOrders: OrderRow[]
  invoicesByOrder: Record<string, InvoiceRow[]>
}) {
  const router = useRouter()

  if (approvedOrders.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Facturación</h3>
        <p className="text-sm text-muted-foreground">Opcional — disponible cuando un pedido esté aprobado.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Facturación <span className="text-xs font-normal text-muted-foreground">(opcional)</span></h3>
      <ul className="space-y-3">
        {approvedOrders.map(o => (
          <li key={o.id} className="border rounded-md px-3 py-2 text-sm space-y-1.5">
            <p className="text-xs text-muted-foreground">Pedido v{o.version}</p>
            {(invoicesByOrder[o.id] ?? []).map(inv => (
              <div key={inv.id} className="flex items-center justify-between text-xs">
                <span>{inv.folio ?? 'Sin folio'}{inv.monto != null && <span className="text-muted-foreground"> · {MXN.format(inv.monto)}</span>}</span>
                <DocLink url={inv.document_url} />
              </div>
            ))}
            <NewInvoiceForm opportunityId={opportunityId} orderId={o.id} onDone={() => router.refresh()} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// ----------------------------------------------------------------
// Panel principal
// ----------------------------------------------------------------
interface Props {
  opportunityId:    string
  quotes:           QuoteRow[]
  orders:           OrderRow[]
  providersByOrder: Record<string, OrderProviderRow[]>
  invoicesByOrder:  Record<string, InvoiceRow[]>
}

export function JunoPipelinePanel({ opportunityId, quotes, orders, providersByOrder, invoicesByOrder }: Props) {
  const acceptedQuotes = quotes.filter(q => q.status === 'aceptada')
  const approvedOrders = orders.filter(o => o.status === 'aprobado')

  return (
    <div className="space-y-6 border rounded-lg p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pipeline Juno Promotional</p>
      <QuoteSection opportunityId={opportunityId} quotes={quotes} />
      <OrderSection
        opportunityId={opportunityId}
        orders={orders}
        acceptedQuotes={acceptedQuotes}
        providersByOrder={providersByOrder}
      />
      <InvoiceSection opportunityId={opportunityId} approvedOrders={approvedOrders} invoicesByOrder={invoicesByOrder} />
    </div>
  )
}
