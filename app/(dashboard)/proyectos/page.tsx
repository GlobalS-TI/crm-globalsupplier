import Link from 'next/link'
import type { Route } from 'next'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectStatusBadge } from '@/components/crm/ProjectStatusBadge'
import { ProjectService } from '@/lib/services/ProjectService'
import { ProjectRepository } from '@/lib/repositories/supabase/ProjectRepository'
import { BUSINESS_UNITS, BRAND_LABELS, PROJECT_STATUSES, PROJECT_STATUS_LABELS } from '@/lib/types'
import type { BusinessUnit, ProjectStatus } from '@/lib/types'

export const metadata = { title: 'Proyectos — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ brand?: string; status?: string }>
}

export default async function ProyectosPage({ searchParams }: PageProps) {
  const { brand, status } = await searchParams

  const projects = await new ProjectService(new ProjectRepository()).listProjects({
    ...(brand  && BUSINESS_UNITS.includes(brand as BusinessUnit)  && { brand:  brand  as BusinessUnit }),
    ...(status && PROJECT_STATUSES.includes(status as ProjectStatus) && { status: status as ProjectStatus }),
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Button asChild size="sm">
          <Link href={'/proyectos/nuevo' as Route}>
            <Plus className="h-4 w-4 mr-1" />
            Nuevo proyecto
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <FilterChips
          param="brand"
          current={brand}
          options={[{ value: '', label: 'Todas las marcas' }, ...BUSINESS_UNITS.map(u => ({ value: u, label: BRAND_LABELS[u] }))]}
          currentStatus={status}
        />
        <FilterChips
          param="status"
          current={status}
          options={[{ value: '', label: 'Todos los estados' }, ...PROJECT_STATUSES.map(s => ({ value: s, label: PROJECT_STATUS_LABELS[s] }))]}
          currentBrand={brand}
        />
      </div>

      {/* Tabla */}
      {projects.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Sin proyectos{brand || status ? ' con esos filtros' : ' registrados'}.
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proyecto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Marca</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Fecha límite</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">Horas est.</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.id} className="border-t hover:bg-muted/30 transition-colors animate-fade-up" style={{ '--stagger': `${i * 30}ms` } as React.CSSProperties}>
                  <td className="px-4 py-3">
                    <Link href={`/proyectos/${p.id}` as Route} className="font-medium hover:underline">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs">{BRAND_LABELS[p.brand as BusinessUnit]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <ProjectStatusBadge status={p.status as ProjectStatus} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {p.due_date
                      ? new Date(p.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {p.estimated_hours != null ? `${p.estimated_hours}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ---- Filter chips (server-rendered links) ----
function FilterChips({
  param, current, options, currentBrand, currentStatus,
}: {
  param: 'brand' | 'status'
  current?: string
  options: { value: string; label: string }[]
  currentBrand?: string
  currentStatus?: string
}) {
  function buildHref(value: string) {
    const p = new URLSearchParams()
    if (param === 'brand'  && value)          p.set('brand', value)
    if (param === 'brand'  && currentStatus)  p.set('status', currentStatus)
    if (param === 'status' && value)          p.set('status', value)
    if (param === 'status' && currentBrand)   p.set('brand', currentBrand)
    const qs = p.toString()
    return (`/proyectos${qs ? `?${qs}` : ''}`) as Route
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => {
        const active = (opt.value === '' && !current) || opt.value === current
        return (
          <Link
            key={opt.value}
            href={buildHref(opt.value)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              active
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-border text-muted-foreground'
            }`}
          >
            {opt.label}
          </Link>
        )
      })}
    </div>
  )
}
