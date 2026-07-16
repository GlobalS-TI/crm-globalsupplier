'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Pencil, PowerOff, Power, Trash2 } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { EditUserDialog } from './EditUserDialog'
import { toggleUserActive, deleteUser } from '@/app/(dashboard)/admin/actions'
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
  users:         ProfileRow[]
  currentUserId: string
}

export function UserTable({ users, currentUserId }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [editingUser, setEditingUser] = useState<ProfileRow | null>(null)
  const [deletingUser, setDeletingUser] = useState<ProfileRow | null>(null)
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

  function handleDelete() {
    if (!deletingUser) return
    const user = deletingUser
    startTransition(async () => {
      const result = await deleteUser(user.id)
      setDeletingUser(null)
      if (result.error) {
        toast({ title: 'No se pudo eliminar', description: result.error, variant: 'destructive' })
        return
      }
      toast({ title: 'Usuario eliminado', description: user.full_name })
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
                        {user.id !== currentUserId && (
                          <DropdownMenuItem
                            onClick={() => setDeletingUser(user)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        )}
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

      <AlertDialog open={!!deletingUser} onOpenChange={open => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar a {deletingUser?.full_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Si el usuario tiene empresas, contactos, oportunidades,
              leads, actividades, tareas o proyectos a su nombre, no se podrá eliminar — desactívalo en
              su lugar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
