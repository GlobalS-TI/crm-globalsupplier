'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { UpdateProfileSchema } from '@/lib/validations/profile'
import { updateUser } from '@/app/(dashboard)/admin/actions'
import { BUSINESS_UNITS, BRAND_LABELS } from '@/lib/types'
import type { ProfileRow } from '@/lib/repositories/interfaces/IProfileRepository'
import type { BusinessUnit, UserRole } from '@/lib/types'

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
  const router  = useRouter()
  const { toast } = useToast()
  const [, startTransition] = useTransition()

  // Profile fields
  const [fullName,  setFullName]  = useState(user.full_name)
  const [role,      setRole]      = useState<UserRole>(user.role)
  const [isActive,  setIsActive]  = useState(String(user.is_active))
  // Auth fields
  const [email,     setEmail]     = useState(user.email)
  const [selectedBUs, setSelectedBUs] = useState<BusinessUnit[]>(user.business_units)
  // Password section
  const [newPassword,       setNewPassword]       = useState('')
  const [sendPasswordEmail, setSendPasswordEmail] = useState(false)

  const [error, setError] = useState<string | null>(null)

  function toggleBU(bu: BusinessUnit) {
    setSelectedBUs(prev =>
      prev.includes(bu) ? prev.filter(b => b !== bu) : [...prev, bu]
    )
  }

  function handleClose() {
    setError(null)
    setNewPassword('')
    setSendPasswordEmail(false)
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = UpdateProfileSchema.safeParse({
      full_name:           fullName,
      role,
      is_active:           isActive === 'true',
      email:               email !== user.email ? email : undefined,
      business_units:      selectedBUs,
      new_password:        newPassword || undefined,
      send_password_email: newPassword ? sendPasswordEmail : undefined,
    })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Datos inválidos')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await updateUser(user.id, parsed.data)
      if (result.error) { setError(result.error); return }
      toast({ title: 'Usuario actualizado' })
      handleClose()
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">

          {/* ── Perfil ── */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input id="full_name" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
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
          </div>

          <Separator />

          {/* ── Credenciales ── */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Credenciales</p>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new_password">Nueva contraseña <span className="text-muted-foreground font-normal">(dejar vacío para no cambiar)</span></Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            {newPassword.length >= 8 && (
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={sendPasswordEmail}
                  onChange={e => setSendPasswordEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                Enviar email al usuario con la nueva contraseña
              </label>
            )}
          </div>

          <Separator />

          {/* ── Business Units ── */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Units</p>
            <div className="grid grid-cols-2 gap-1.5">
              {BUSINESS_UNITS.map(bu => (
                <label key={bu} className="flex items-center gap-2 cursor-pointer text-sm rounded-md px-2 py-1.5 hover:bg-accent transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedBUs.includes(bu)}
                    onChange={() => toggleBU(bu)}
                    className="h-4 w-4 rounded border-input accent-primary"
                  />
                  {BRAND_LABELS[bu]}
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
