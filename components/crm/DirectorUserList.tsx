import Link from 'next/link'
import type { Route } from 'next'
import { ChevronRight } from 'lucide-react'

type UserLite = { id: string; full_name: string; email: string }

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

interface Props {
  users: UserLite[]
}

export function DirectorUserList({ users }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Actividades por usuario</h1>
        <p className="text-sm text-muted-foreground">Selecciona un usuario para ver su listado de actividades.</p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay usuarios activos.</p>
        ) : (
          <div className="rounded-md border divide-y">
            {users.map(u => (
              <Link
                key={u.id}
                href={`/actividades?usuario=${u.id}` as Route}
                className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">
                  {initials(u.full_name)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
