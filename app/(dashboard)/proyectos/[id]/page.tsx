import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProjectService } from '@/lib/services/ProjectService'
import { ProjectRepository } from '@/lib/repositories/supabase/ProjectRepository'
import { ProjectStatusBadge } from '@/components/crm/ProjectStatusBadge'
import { ProjectForm } from '@/components/crm/ProjectForm'
import { ProjectStageTransition } from '@/components/crm/ProjectStageTransition'
import { ProjectBriefForm } from '@/components/crm/ProjectBriefForm'
import { ProjectHandoffForm } from '@/components/crm/ProjectHandoffForm'
import { ProjectDecisionLog } from '@/components/crm/ProjectDecisionLog'
import { ProjectFilesPanel } from '@/components/crm/ProjectFilesPanel'
import { ProjectStageLog } from '@/components/crm/ProjectStageLog'
import { ProjectDeleteButton } from '@/components/crm/ProjectDeleteButton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { BRAND_LABELS, PROJECT_TIPO_LABELS } from '@/lib/types'
import type { BusinessUnit, ProjectStatus, ProjectTipo } from '@/lib/types'
import {
  updateProject, advanceStatus, saveBrief, saveHandoff,
  addDecisionEntry, addFile, deleteFile, deleteProject,
} from '@/app/(dashboard)/proyectos/actions'

export const dynamic  = 'force-dynamic'

interface PageProps {
  params:       Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

type TabId = 'resumen' | 'brief' | 'handoff' | 'decisiones' | 'archivos'

export default async function ProyectoDetailPage({ params, searchParams }: PageProps) {
  const { id }  = await params
  const { tab } = await searchParams

  const [project, supabase] = await Promise.all([
    new ProjectService(new ProjectRepository()).getProjectById(id),
    createClient(),
  ])

  if (!project) notFound()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name')

  const tipo    = (project.tipo ?? 'DISENO') as ProjectTipo
  const status  = project.status as ProjectStatus
  const isDiseno = tipo === 'DISENO'

  const tabs: { id: TabId; label: string }[] = [
    { id: 'resumen',    label: 'Resumen' },
    { id: 'brief',      label: 'Brief' },
    ...(isDiseno ? [{ id: 'handoff' as TabId, label: 'Handoff' }] : []),
    { id: 'decisiones', label: 'Decisiones' },
    { id: 'archivos',   label: 'Archivos' },
  ]
  const activeTab: TabId = (tabs.find(t => t.id === tab)?.id) ?? 'resumen'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-0 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                {BRAND_LABELS[project.brand as BusinessUnit]}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {PROJECT_TIPO_LABELS[tipo]}
              </Badge>
              <ProjectStatusBadge status={status} />
            </div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              {project.stakeholder   && <span>Aprueba: <strong className="text-foreground">{project.stakeholder.full_name}</strong></span>}
              {project.requested_by  && <span>Solicitado por: <strong className="text-foreground">{project.requested_by.full_name}</strong></span>}
              {project.start_date    && <span>Inicio: <strong className="text-foreground">{new Date(project.start_date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>}
              {project.due_date      && <span>Límite: <strong className="text-foreground">{new Date(project.due_date + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>}
            </div>
          </div>

          {/* Acciones */}
          <div className="shrink-0 flex items-center gap-2">
            <ProjectStageTransition
              projectId={project.id}
              tipo={tipo}
              status={status}
              action={advanceStatus.bind(null, project.id)}
            />
            <ProjectDeleteButton
              projectTitle={project.title}
              action={deleteProject.bind(null, project.id)}
            />
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 border-b -mx-8 px-8 overflow-x-auto">
          {tabs.map(t => (
            <Link
              key={t.id}
              href={`/proyectos/${id}?tab=${t.id}` as Route}
              className={cn(
                'shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === t.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {activeTab === 'resumen' && (
          <div className="max-w-2xl space-y-8">
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Editar proyecto</h2>
              <ProjectForm
                action={updateProject.bind(null, project.id)}
                project={project}
                profiles={profiles ?? []}
              />
            </section>
            <Separator />
            <ProjectStageLog logs={project.stage_logs} />
          </div>
        )}

        {activeTab === 'brief' && (
          <div className="max-w-2xl">
            <ProjectBriefForm
              action={saveBrief.bind(null, project.id)}
              brief={project.brief}
            />
          </div>
        )}

        {activeTab === 'handoff' && (
          <div className="max-w-2xl">
            <ProjectHandoffForm
              action={saveHandoff.bind(null, project.id)}
              handoff={project.handoff}
              status={status}
            />
          </div>
        )}

        {activeTab === 'decisiones' && (
          <div className="max-w-2xl">
            <ProjectDecisionLog
              action={addDecisionEntry.bind(null, project.id)}
              entries={project.decision_logs}
            />
          </div>
        )}

        {activeTab === 'archivos' && (
          <div className="max-w-3xl">
            <ProjectFilesPanel
              addAction={addFile.bind(null, project.id)}
              deleteAction={deleteFile.bind(null, project.id)}
              files={project.files}
            />
          </div>
        )}
      </div>
    </div>
  )
}
