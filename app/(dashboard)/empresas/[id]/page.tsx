import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import { ChevronLeft, UserRound, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CompanyForm } from '@/components/crm/CompanyForm'
import { DeleteButton } from '@/components/crm/DeleteButton'
import { CompanyRepository } from '@/lib/repositories/supabase/CompanyRepository'
import { CompanyService } from '@/lib/services/CompanyService'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'
import { updateCompany, deleteCompany } from '../actions'

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
  const company = await new CompanyService(new CompanyRepository()).getByIdWithContacts(id).catch(() => null)
  return { title: `${company?.nombre ?? 'Empresa'} — CRM Global Supplier` }
}

export default async function EmpresaDetailPage({ params }: PageProps) {
  const { id } = await params

  const [company, opportunities] = await Promise.all([
    new CompanyService(new CompanyRepository()).getByIdWithContacts(id).catch(() => null),
    new OpportunityService(new OpportunityRepository()).listPipeline({ }),
  ])

  if (!company) notFound()

  const companyOpps = opportunities.filter(o => o.company_id === id)

  const updateAction = updateCompany.bind(null, id)
  const deleteAction = deleteCompany.bind(null, id)

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href={'/empresas' as Route} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Empresas
        </Link>
        <DeleteButton action={deleteAction} label="Eliminar empresa" confirmMessage={`¿Eliminar "${company.nombre}"? Las oportunidades y contactos vinculados quedarán sin empresa asignada.`} />
      </div>

      <h1 className="text-2xl font-bold">{company.nombre}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos de la empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyForm action={updateAction} defaultValues={company} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* Contacts */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <UserRound className="h-4 w-4" />
                Contactos ({company.contacts.length})
              </CardTitle>
              <Link
                href={`/contactos/nuevo?company_id=${id}` as Route}
                className="text-xs text-primary hover:underline"
              >
                + Agregar
              </Link>
            </CardHeader>
            <CardContent className="pt-0">
              {company.contacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin contactos vinculados.</p>
              ) : (
                <ul className="space-y-2">
                  {company.contacts.map(c => (
                    <li key={c.id}>
                      <Link href={`/contactos/${c.id}` as Route} className="text-sm font-medium hover:underline">
                        {c.nombre} {c.apellido ?? ''}
                      </Link>
                      {c.puesto && <p className="text-xs text-muted-foreground">{c.puesto}</p>}
                      {c.email  && <p className="text-xs text-muted-foreground">{c.email}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Oportunidades ({companyOpps.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {companyOpps.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin oportunidades vinculadas.</p>
              ) : (
                <ul className="space-y-2">
                  {companyOpps.map(o => (
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
    </div>
  )
}
