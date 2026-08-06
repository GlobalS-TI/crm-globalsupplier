import Link from 'next/link'
import type { Route } from 'next'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DisplayValue } from '@/components/crm/TaskBoardCell'
import type { BoardWithColumns, TaskGroupRow, TaskWithValues } from '@/lib/repositories/interfaces/ITaskRepository'

type UserLite = { id: string; full_name: string; email: string }

interface Props {
  board:      BoardWithColumns
  groups:     TaskGroupRow[]
  tasks:      TaskWithValues[]
  targetUser: UserLite
  users:      UserLite[]
}

const dateFmt = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

export function UserActivitiesReadOnly({ board, groups, tasks, targetUser, users }: Props) {
  const sortedColumns = [...board.columns].sort((a, b) => a.position - b.position)

  const byGroup = new Map<string | null, TaskWithValues[]>()
  for (const t of tasks) {
    const key = t.group_id
    byGroup.set(key, [...(byGroup.get(key) ?? []), t])
  }

  const sections = [
    ...[...groups].sort((a, b) => a.position - b.position).map(g => ({
      id: g.id, nombre: g.nombre, color: g.color as string | null, tasks: byGroup.get(g.id) ?? [],
    })),
    { id: null, nombre: 'Sin grupo', color: null, tasks: byGroup.get(null) ?? [] },
  ].filter(s => s.tasks.length > 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <Link
            href={'/actividades' as Route}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver a usuarios
          </Link>
          <h1 className="text-lg font-semibold">Actividades de {targetUser.full_name}</h1>
          <p className="text-sm text-muted-foreground">{targetUser.email} · Solo lectura</p>
        </div>
        <Badge variant="outline">{tasks.length} actividad{tasks.length === 1 ? '' : 'es'}</Badge>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-8">
        {sections.length === 0 && (
          <p className="text-sm text-muted-foreground">Este usuario no tiene actividades registradas.</p>
        )}
        {sections.map(section => (
          <div key={section.id ?? 'sin-grupo'}>
            <h2 className="flex items-center gap-2 text-sm font-semibold mb-2">
              {section.color && (
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: section.color }} />
              )}
              {section.nombre}
              <span className="text-muted-foreground font-normal">({section.tasks.length})</span>
            </h2>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Título</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">Entrega</th>
                    {sortedColumns.map(col => (
                      <th key={col.id} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                        {col.nombre}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {section.tasks.map(t => (
                    <tr key={t.id} className="border-t">
                      <td className="px-3 py-2 font-medium">{t.titulo}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {t.fecha_entrega ? dateFmt.format(new Date(t.fecha_entrega)) : '—'}
                      </td>
                      {sortedColumns.map(col => (
                        <td key={col.id} className="px-3 py-2">
                          <DisplayValue col={col} value={t.column_values[col.id] ?? null} users={users} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
