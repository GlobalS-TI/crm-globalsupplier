'use client'

import { useActionState } from 'react'
import type { ActionState } from '@/app/(dashboard)/oportunidades/actions'

interface QuickStageButtonProps {
  label: string
  stage: string
  action: (prev: ActionState, form: FormData) => Promise<ActionState>
}

export function QuickStageButton({ label, stage, action }: QuickStageButtonProps) {
  const [, formAction, pending] = useActionState(action, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="etapa" value={stage} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center px-3 py-1.5 text-sm border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
      >
        {pending ? '…' : label}
      </button>
    </form>
  )
}
