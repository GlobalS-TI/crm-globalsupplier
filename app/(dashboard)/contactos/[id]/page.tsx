import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ContactForm } from '@/components/crm/ContactForm'
import { DeleteButton } from '@/components/crm/DeleteButton'
import { ContactRepository } from '@/lib/repositories/supabase/ContactRepository'
import { ContactService } from '@/lib/services/ContactService'
import { CompanyRepository } from '@/lib/repositories/supabase/CompanyRepository'
import { CompanyService } from '@/lib/services/CompanyService'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { updateContact, deleteContact } from '../actions'

export const dynamic = 'force-dynamic'

const fmtCurrency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })

const STAGE_LABELS: Record<string, string> = {
  nuevo_lead:         'Nuevo lead',
  contactado:         'Contactado',
  diagnostico:        'Diagnóstico',
  cotizacion_enviada: 'Cotización',
  seguimiento:        'Seguimiento',
  negociacion:        'Negociación',
  ganado:             'Ganado',
  perdido:            'Perdido',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const contact = await new ContactService(new ContactRepository()).getByIdWithCompany(id).catch(() => null)
  const name = contact ? `${contact.nombre}${contact.apellido ? ' ' + contact.apellido : ''}` : 'Contacto'
  return { title: `${name} — CRM Global Supplier` }
}

export default async function ContactoDetailPage({ params }: PageProps) {
  const { id } = await params

  const [contact, companies, opportunities] = await Promise.all([
    new ContactService(new ContactRepository()).getByIdWithCompany(id).catch(() => null),
    new CompanyService(new CompanyRepository()).list(),
    new OpportunityService(new OpportunityRepository()).listPipeline({}),
  ])

  if (!contact) notFound()

  const contactOpps = opportunities.filter(o => o.contact_id === id)
  const fullName    = `${contact.nombre}${contact.apellido ? ' ' + contact.apellido : ''}`

  const updateAction = updateContact.bind(null, id)
  const deleteAction = deleteContact.bind(null, id)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href={'/contactos' as Route} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Contactos
        </Link>
        <DeleteButton action={deleteAction} label="Eliminar contacto" confirmMessage={`¿Eliminar a "${fullName}"? Las oportunidades vinculadas quedarán sin contacto asignado.`} />
      </div>

      <div>
        <h1 className="text-2xl font-bold">{fullName}</h1>
        {contact.puesto && <p className="text-sm text-muted-foreground mt-1">{contact.puesto}</p>}
        {contact.company && (
          <Link href={`/empresas/${contact.company.id}` as Route} className="text-sm text-primary hover:underline mt-1 inline-block">
            {contact.company.nombre}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos del contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <ContactForm
              action={updateAction}
              defaultValues={contact}
              companies={companies}
            />
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Oportunidades ({contactOpps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {contactOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin oportunidades vinculadas.</p>
            ) : (
              <ul className="space-y-2">
                {contactOpps.map(o => (
                  <li key={o.id} className="flex items-center justify-between gap-2">
                    <Link href={`/oportunidades/${o.id}` as Route} className="text-sm font-medium hover:underline truncate">
                      {o.nombre}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{fmtCurrency.format(Number(o.monto_estimado))}</span>
                      <Badge variant="outline" className="text-xs">{STAGE_LABELS[o.etapa] ?? o.etapa}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
