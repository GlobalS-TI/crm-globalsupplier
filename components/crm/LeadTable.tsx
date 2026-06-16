'use client'

import { useTransition } from 'react'
import { ExternalLink, FileDown, Mail, Phone, Trash2 } from 'lucide-react'
import { LeadImportButton } from '@/components/crm/LeadImportButton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { NewLeadButton, EditLeadButton, type AssignableUser } from '@/components/crm/LeadModal'
import { ConvertLeadButton } from '@/components/crm/ConvertLeadModal'
import { deleteLeadSilent } from '@/app/(dashboard)/leads/actions'
import type { LeadWithRelations, LeadSectionRow } from '@/lib/repositories/interfaces/ILeadRepository'

function DeleteLeadButton({ lead }: { lead: LeadWithRelations }) {
  const [pending, start] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={pending}
          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar lead?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminará &quot;{lead.nombre}&quot;
            {lead.empresa ? ` de ${lead.empresa}` : ''}. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => start(async () => { await deleteLeadSilent(lead.id) })}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface Props {
  leads:            LeadWithRelations[]
  section:          LeadSectionRow | null
  sectionId:        string
  canManageLeads:   boolean
  isLeadsManager:   boolean
  assignableUsers:  AssignableUser[]
  requirementUrls?: Record<string, string>
}

export function LeadTable({ leads, section, sectionId, canManageLeads, isLeadsManager, assignableUsers, requirementUrls }: Props) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{section?.nombre ?? 'Leads'}</h1>
          {section?.descripcion && (
            <p className="text-sm text-muted-foreground mt-0.5">{section.descripcion}</p>
          )}
        </div>
        {canManageLeads && (
          <div className="flex items-center gap-2">
            <LeadImportButton sectionId={sectionId} />
            <NewLeadButton sectionId={sectionId} assignableUsers={assignableUsers} />
          </div>
        )}
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Sin leads en esta sección.
          {canManageLeads && (
            <span className="block mt-2 text-primary text-xs">
              Usa &quot;Nuevo lead&quot; o importa desde un archivo CSV/XLSX.
            </span>
          )}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Nombre</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden md:table-cell">Empresa</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden lg:table-cell">Contacto</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">Responsable</th>
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground hidden xl:table-cell">Vendedor</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground w-24">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {leads.map(lead => (
                <tr key={lead.id} className="group border-t first:border-t-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-medium">{lead.nombre}</span>
                    {lead.requerimientos && (
                      lead.requerimientos.startsWith('http') ? (
                        <a
                          href={lead.requerimientos}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          Ver requierimientos
                        </a>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {lead.requerimientos}
                        </p>
                      )
                    )}
                    {requirementUrls?.[lead.id] && (
                      <a
                        href={requirementUrls[lead.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                      >
                        <FileDown className="h-3 w-3 shrink-0" />
                        Ver archivo
                      </a>
                    )}
                    {lead.converted_opportunity_id && (
                      <Badge variant="secondary" className="mt-1 text-xs">Convertido</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {lead.empresa ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-col gap-0.5">
                      {lead.email && (
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </a>
                      )}
                      {lead.telefono && (
                        <a
                          href={`tel:${lead.telefono}`}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Phone className="h-3 w-3" />
                          {lead.telefono}
                        </a>
                      )}
                      {!lead.email && !lead.telefono && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {lead.responsable
                      ? <span className="text-xs">{lead.responsable.full_name}</span>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {lead.vendedor
                      ? <span className="text-xs">{lead.vendedor.full_name}</span>
                      : <span className="text-xs text-muted-foreground">Sin asignar</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5">
                      {canManageLeads && !lead.converted_opportunity_id && (
                        <>
                          <ConvertLeadButton lead={lead} assignableUsers={assignableUsers} />
                          <EditLeadButton
                            lead={lead}
                            assignableUsers={assignableUsers}
                            requirementUrl={requirementUrls?.[lead.id]}
                          />
                          <DeleteLeadButton lead={lead} />
                        </>
                      )}
                    </div>
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
