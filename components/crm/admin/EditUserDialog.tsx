'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { UpdateProfileSchema } from '@/lib/validations/profile'
import type { UpdateProfileInput } from '@/lib/validations/profile'
import { updateUser } from '@/app/(dashboard)/admin/actions'
import type { ProfileRow } from '@/lib/repositories/interfaces/IProfileRepository'

const ROLE_LABELS: Record<string, string> = {
  director_general:   'Director General',
  direccion_comercial:'Dirección Comercial',
  vendedor:           'Vendedor',
  marketing:          'Marketing',
  administracion:     'Administración / TI',
}

interface Props {
  user:     ProfileRow
  open:     boolean
  onClose:  () => void
}

export function EditUserDialog({ user, open, onClose }: Props) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(UpdateProfileSchema),
    values: {
      full_name: user.full_name,
      role:      user.role,
      is_active: user.is_active,
    },
  })

  async function onSubmit(data: UpdateProfileInput) {
    setLoading(true)
    const result = await updateUser(user.id, data)
    setLoading(false)
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
      return
    }
    toast({ title: 'Usuario actualizado' })
    onClose()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar usuario</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre completo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Rol</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="is_active" render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormLabel className="mt-0">Cuenta activa</FormLabel>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando…' : 'Guardar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
