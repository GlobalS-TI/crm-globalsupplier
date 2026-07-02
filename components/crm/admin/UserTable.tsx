'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, PowerOff, Power } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { EditUserDialog } from './EditUserDialog'
import { toggleUserActive } from '@/app/(dashboard)/admin/actions'
import type { ProfileRow } from '@/lib/repositories/interfaces/IProfileRepository'
import { BRAND_LABELS } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  director_general:    'Director General',
  direccion_comercial: 'Dir. Comercial',
  vendedor:            'Vendedor',
  marketing:           'Marketing',
  administracion:      'Admin / TI',
}

const ROLE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  director_general:    'default',
  direccion_comercial: 'default',
  marketing:           'secondary',
  vendedor:            'outline',
  administracion:      'destructive',
}

interface Props {
  users: ProfileRow[]
}

export function UserTable({ users }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null)
  const [, startTransition] = useTransition()

  function handleToggleActive(user: ProfileRow) {
    startTransition(async () => {
      const result = await toggleUserActive(user.id, !user.is_active)
      if (result.error) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }
      toast({
        title: user.is_active ? 'Usuario desactivado' : 'Usuario activado',
        description: user.full_name,
      })
      router.refresh()
    })
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Business Units</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Sin usuarios
                </TableCell>
              </TableRow>
            ) : (
              users.map(user => (
                <TableRow key={user.id} className={!user.is_active ? 'opacity-50' : undefined}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANTS[user.role] ?? 'outline'}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {user.business_units.length === 0
                      ? '—'
                      : user.business_units.map(bu => BRAND_LABELS[bu] ?? bu).join(', ')
                    }
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.is_active ? 'default' : 'secondary'}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingUser(user)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                          {user.is_active
                            ? <><PowerOff className="h-4 w-4 mr-2" /> Desactivar</>
                            : <><Power     className="h-4 w-4 mr-2" /> Activar</>
                          }
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          open={!!editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  )
}
