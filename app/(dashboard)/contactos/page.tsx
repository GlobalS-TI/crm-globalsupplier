import Link from 'next/link'
import type { Route } from 'next'
import { Suspense } from 'react'
import { Plus, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/crm/SearchInput'
import { ContactRepository } from '@/lib/repositories/supabase/ContactRepository'
import { ContactService } from '@/lib/services/ContactService'

export const metadata = { title: 'Contactos — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; company_id?: string }>
}

async function ContactList({ search, companyId }: { search?: string; companyId?: string }) {
  const contacts = await new ContactService(new ContactRepository()).list({ search, companyId })

  if (!contacts.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {search ? `Sin resultados para "${search}".` : 'Sin contactos registrados.'}
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contacto</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Empresa</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Email</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Teléfono</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map(c => (
            <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/contactos/${c.id}` as Route} className="font-medium hover:underline flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                  {c.nombre} {c.apellido ?? ''}
                </Link>
                {c.puesto && <p className="text-xs text-muted-foreground mt-0.5">{c.puesto}</p>}
              </td>
              <td className="px-4 py-3 hidden sm:table-cell">
                {c.company ? (
                  <Link href={`/empresas/${c.company.id}` as Route} className="text-sm hover:underline text-muted-foreground">
                    {c.company.nombre}
                  </Link>
                ) : (
                  <Badge variant="outline" className="text-xs">Sin empresa</Badge>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                {c.email ? <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a> : '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                {c.celular ?? c.telefono ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function ContactosPage({ searchParams }: PageProps) {
  const { q, company_id } = await searchParams

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Contactos</h1>
        <Button asChild size="sm">
          <Link href={'/contactos/nuevo' as Route}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo contacto
          </Link>
        </Button>
      </div>

      <Suspense>
        <SearchInput placeholder="Buscar contacto…" />
      </Suspense>

      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <ContactList search={q} companyId={company_id} />
      </Suspense>
    </div>
  )
}
