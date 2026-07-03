'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default function RestablecerContrasenaPage() {
  const router = useRouter()
  const supabase = createClient()
  const [, startTransition] = useTransition()

  const [ready,    setReady]    = useState(false)
  const [expired,  setExpired]  = useState(false)
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)

  // Supabase procesa el hash y emite PASSWORD_RECOVERY cuando el token es válido
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    // Si en 6 s no llega el evento, el token es inválido o ya expiró
    const timer = setTimeout(() => setExpired(true), 6000)
    return () => { subscription.unsubscribe(); clearTimeout(timer) }
  }, [supabase])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Mínimo 8 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setError(null)

    startTransition(async () => {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) { setError(updateError.message); return }
      setSuccess(true)
      setTimeout(() => router.replace('/dashboard'), 2000)
    })
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Restablecer contraseña</CardTitle>
        <CardDescription>CRM Global Supplier</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <p className="text-sm text-center text-muted-foreground">
            ¡Contraseña actualizada! Redirigiendo…
          </p>
        ) : expired && !ready ? (
          <div className="text-center space-y-3">
            <p className="text-sm text-destructive">El enlace es inválido o ya expiró.</p>
            <a href="/login" className="text-sm text-primary underline underline-offset-4">
              Volver al inicio de sesión
            </a>
          </div>
        ) : !ready ? (
          <p className="text-sm text-center text-muted-foreground">
            Verificando enlace…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repite la contraseña"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Guardar nueva contraseña</Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
