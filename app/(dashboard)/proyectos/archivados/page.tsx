import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft, ArchiveX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ProjectStatusBadge } from '@/components/crm/ProjectStatusBadge'
import { ProjectService } from '@/lib/services/ProjectService'
import { ProjectRepository } from '@/lib/repositories/supabase/ProjectRepository'
import { BRAND_LABELS, PROJECT_TIPO_LABELS } from '@/lib/types'
import type { BusinessUnit, ProjectStatus, ProjectTipo } from '@/lib/types'
import { UnarchiveButton } from '@/components/crm/UnarchiveButton'
import { unarchiveProject, deleteProject } from '@/app/(dashboard)/proyectos/actions'

export const metadata = { title: 'Proyectos archivados — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

export default async function ProyectosArchivadosPage() {
  const projects = await new ProjectService(new ProjectRepository()).listProjects({ archived: true })

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground -ml-2">
          <Link href="/proyectos">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Proyectos
          </Link>
        </Button>
        <div className="h-4 w-px bg-border" />
        <h1 className="text-2xl font-bold">Proyectos archivados</h1>
        <Badge variant="secondary">{projects.length}</Badge>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm space-y-2">
          <ArchiveX className="h-10 w-10 mx-auto opacity-30" />
          <p>No hay proyectos archivados.</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Proyecto</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Marca</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Tipo</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="w-32" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p, i) => (
                <tr key={p.id} className="border-t bg-muted/20 hover:bg-muted/30 transition-colors" style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-4 py-3">
                    <Link href={`/proyectos/${p.id}` as Route} className="font-medium hover:underline text-muted-foreground">
                      {p.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs opacity-60">{BRAND_LABELS[p.brand as BusinessUnit]}</Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="secondary" className="text-xs opacity-60">{PROJECT_TIPO_LABELS[(p.tipo ?? 'DISENO') as ProjectTipo]}</Badge>
                  </td>
                  <td className="px-4 py-3 opacity-60">
                    <ProjectStatusBadge status={p.status as ProjectStatus} />
                  </td>
                  <td className="px-3 py-3">
                    <UnarchiveButton
                      projectId={p.id}
                      unarchiveAction={unarchiveProject}
                      deleteAction={deleteProject}
                    />
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
