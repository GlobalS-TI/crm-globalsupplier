'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import type { Route } from 'next'
import {
  LayoutDashboard,
  Briefcase,
  Building2,
  Users,
  Activity,
  Library,
  UserRoundSearch,
  Target,
  FolderKanban,
  BarChart2,
  LogOut,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { logout } from '@/app/(dashboard)/actions'
import { ThemeToggle } from './ThemeToggle'
import { NotificationBell } from './NotificationBell'
import { PROJECT_ROLES, COMISIONES_ROLES } from '@/lib/types'
import type { UserRole } from '@/lib/types'

const NAV_ITEMS: { href: Route; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/oportunidades', label: 'Oportunidades', icon: Briefcase },
  { href: '/empresas',      label: 'Empresas',      icon: Building2 },
  { href: '/contactos',     label: 'Contactos',     icon: Users },
  { href: '/actividades',   label: 'Actividades',   icon: Activity },
  { href: '/contenido',     label: 'Contenido',     icon: Library },
  { href: '/leads',         label: 'Leads',         icon: UserRoundSearch },
  { href: '/metas',         label: 'Metas',         icon: Target },
]

interface AppSidebarProps {
  userFullName: string
  userEmail:    string
  userRole:     UserRole
  userId:       string
}

export function AppSidebar({ userFullName, userEmail, userRole, userId }: AppSidebarProps) {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [bouncing, setBouncing] = useState(false)
  const prevTheme = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (prevTheme.current === undefined) {
      prevTheme.current = resolvedTheme
      return
    }
    if (prevTheme.current !== resolvedTheme) {
      prevTheme.current = resolvedTheme
      setBouncing(true)
      const t = setTimeout(() => setBouncing(false), 800)
      return () => clearTimeout(t)
    }
  }, [resolvedTheme])

  const initials = userFullName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  return (
    <aside className="flex flex-col w-60 h-screen bg-card border-r shrink-0">
      {/* Brand */}
      <div className="px-4 py-5">
        <span className="font-semibold text-sm tracking-tight">Global Supplier CRM</span>
      </div>

      <Separator />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }, i) => (
          <Link key={href} href={href}>
            <span
              key={`${href}-${bouncing}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                bouncing && 'nav-bounce-item',
                pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              style={{ '--nav-i': i } as React.CSSProperties}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </span>
          </Link>
        ))}

        {/* Proyectos — solo roles autorizados (RLS es la seguridad real) */}
        {PROJECT_ROLES.includes(userRole) && (
          <Link href={'/proyectos' as Route}>
            <span
              key={`proyectos-${bouncing}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                bouncing && 'nav-bounce-item',
                pathname === '/proyectos' || pathname.startsWith('/proyectos/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              style={{ '--nav-i': NAV_ITEMS.length } as React.CSSProperties}
            >
              <FolderKanban className="h-4 w-4 shrink-0" />
              Proyectos
            </span>
          </Link>
        )}

        {/* Comisiones — director_general y administracion únicamente (RLS es la seguridad real) */}
        {COMISIONES_ROLES.includes(userRole) && (
          <Link href={'/comisiones' as Route}>
            <span
              key={`comisiones-${bouncing}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                bouncing && 'nav-bounce-item',
                pathname === '/comisiones' || pathname.startsWith('/comisiones/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              style={{ '--nav-i': NAV_ITEMS.length + 1 } as React.CSSProperties}
            >
              <BarChart2 className="h-4 w-4 shrink-0" />
              Comisiones
            </span>
          </Link>
        )}
      </nav>

      <Separator />

      {/* User */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{userFullName}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>
        </div>
        <NotificationBell userId={userId} />
        <ThemeToggle />
        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Salir
          </Button>
        </form>
      </div>
    </aside>
  )
}
