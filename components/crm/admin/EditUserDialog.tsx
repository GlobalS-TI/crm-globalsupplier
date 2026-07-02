'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { UpdateProfileSchema } from '@/lib/validations/profile'
import { updateUser } from '@/app/(dashboard)/admin/actions'
import type { ProfileRow } from '@/lib/repositories/interfaces/IProfileRepository'

const ROLE_LABELS: Record<string, string> = {
  director_general:    'Director General',
  direccion_comercial: 'Dirección Comercial',
  vendedor:            'Vendedor',
  marketing:           'Marketing',
  administracion:      'Administración / TI',
}

interface Props {
  user:    ProfileRow
  open:    boolean
  onClose: () => void
}

export function EditUserDialog({ user, open, onClose }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [, startTransition] = useTransition()
  const [fullName, setFullName] = useState(user.full_name)
  const [role, setRole]         = useState(user.role)
  const [isActive, setIsActive] = useState(String(user.is_active))
  const [error, setError]       = useState<string | null>(null)

  function handleClose() {
    setError(null)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = UpdateProfileSchema.safeParse({ full_name: fullName, role, is_active: isActive === 'true' })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Datos inválidos')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await updateUser(user.id, parsed.data)
      if (result.error) {
        setError(result.error)
        return
      }
      toast({ title: 'Usuario actualizado' })
      onClose()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={v => setRole(v as typeof role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Estado</Label>
            <Select value={isActive} onValueChange={setIsActive}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Activo</SelectItem>
                <SelectItem value="false">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
