'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/app/(auth)/login/actions'
import type { Route } from 'next'

export function LoginForm() {
  const router = useRouter()
  const [state, action, pending] = useActionState(login, null)

  // Supabase redirige recovery links al site URL (login). Detectamos y rebotamos.
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=recovery')) {
      router.replace((`/restablecer-contrasena${hash}`) as Route)
    }
  }, [router])

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="tu@empresa.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Ingresando…' : 'Ingresar'}
      </Button>
    </form>
  )
}
