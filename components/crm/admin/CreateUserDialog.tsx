'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { CreateUserSchema } from '@/lib/validations/profile'
import { createUser } from '@/app/(dashboard)/admin/actions'
import { UserPlus } from 'lucide-react'
import type { UserRole } from '@/lib/types'

const ROLE_LABELS: Record<string, string> = {
  director_general:    'Director General',
  direccion_comercial: 'Dirección Comercial',
  vendedor:            'Vendedor',
  marketing:           'Marketing',
  administracion:      'Administración / TI',
}

export function CreateUserDialog() {
  const router = useRouter()
  const { toast } = useToast()
  const [, startTransition] = useTransition()
  const [open, setOpen]       = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState<UserRole>('vendedor')
  const [error, setError]       = useState<string | null>(null)

  function reset() {
    setFullName(''); setEmail(''); setPassword(''); setRole('vendedor'); setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = CreateUserSchema.safeParse({ email, full_name: fullName, password, role })
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message ?? 'Datos inválidos')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createUser(parsed.data)
      if (result.error) {
        setError(result.error)
        return
      }
      toast({ title: 'Usuario creado', description: `${fullName} ya puede iniciar sesión.` })
      reset()
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear usuario</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input id="full_name" placeholder="Ej: María Hernández" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="usuario@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Contraseña temporal</Label>
            <Input id="password" type="password" placeholder="Mínimo 8 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Rol</Label>
            <Select value={role} onValueChange={v => setRole(v as UserRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => { setOpen(false); reset() }}>Cancelar</Button>
            <Button type="submit">Crear usuario</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
