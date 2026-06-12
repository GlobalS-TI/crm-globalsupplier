import Link from 'next/link'
import type { Route } from 'next'
import { Suspense } from 'react'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SearchInput } from '@/components/crm/SearchInput'
import { CompanyRepository } from '@/lib/repositories/supabase/CompanyRepository'
import { CompanyService } from '@/lib/services/CompanyService'

export const metadata = { title: 'Empresas — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string }>
}

async function CompanyList({ search }: { search?: string }) {
  const companies = await new CompanyService(new CompanyRepository()).list(search)

  if (!companies.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        {search ? `Sin resultados para "${search}".` : 'Sin empresas registradas.'}
      </div>
    )
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Empresa</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Industria</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Ciudad / Estado</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Teléfono</th>
          </tr>
        </thead>
        <tbody>
          {companies.map(c => (
            <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/empresas/${c.id}` as Route} className="font-medium hover:underline flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  {c.nombre}
                </Link>
                {c.rfc && <p className="text-xs text-muted-foreground mt-0.5">RFC: {c.rfc}</p>}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                {c.industria ? <Badge variant="outline">{c.industria}</Badge> : '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                {[c.ciudad, c.estado].filter(Boolean).join(', ') || '—'}
              </td>
              <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                {c.telefono ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function EmpresasPage({ searchParams }: PageProps) {
  const { q } = await searchParams

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Empresas</h1>
        <Button asChild size="sm">
          <Link href={'/empresas/nueva' as Route}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva empresa
          </Link>
        </Button>
      </div>

      <Suspense>
        <SearchInput placeholder="Buscar empresa…" />
      </Suspense>

      <Suspense fallback={<p className="text-muted-foreground text-sm">Cargando…</p>}>
        <CompanyList search={q} />
      </Suspense>
    </div>
  )
}
