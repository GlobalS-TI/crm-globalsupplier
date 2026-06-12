'use client'

import { useActionState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notifyStaleOpportunities } from '@/app/(dashboard)/dashboard/actions'

type State = { sent: number; error?: string } | null

export function StaleNotifyButton() {
  const [state, action, pending] = useActionState<State, FormData>(
    async () => notifyStaleOpportunities(),
    null
  )

  return (
    <div className="flex items-center gap-3">
      <form action={action}>
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
          <Bell className="h-4 w-4 mr-2" />
          {pending ? 'Enviando…' : 'Notificar vencidas'}
        </Button>
      </form>
      {state && (
        <p className="text-sm text-muted-foreground">
          {state.error
            ? `Error: ${state.error}`
            : state.sent === 0
              ? 'Sin destinatarios o sin oportunidades vencidas.'
              : `Notificación enviada a ${state.sent} usuario${state.sent > 1 ? 's' : ''}.`}
        </p>
      )}
    </div>
  )
}
