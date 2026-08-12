'use client'

import { useActionState, useRef } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IT_TICKET_PRIORITIES, IT_TICKET_PRIORITY_LABELS } from '@/lib/types'
import type { ITTicketPriority } from '@/lib/types'
import type { ActionState } from '@/app/(dashboard)/soporte-ti/actions'

interface Props {
  priority: ITTicketPriority
  action:   (prev: ActionState, form: FormData) => Promise<ActionState>
}

export function ITTicketPrioritySelect({ priority, action }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, dispatch, pending] = useActionState(action, null)

  return (
    <form ref={formRef} action={dispatch} className="inline-flex flex-col gap-1">
      <input type="hidden" name="priority" defaultValue={priority} />
      <Select
        defaultValue={priority}
        disabled={pending}
        onValueChange={value => {
          const input = formRef.current?.elements.namedItem('priority') as HTMLInputElement
          if (input) input.value = value
          formRef.current?.requestSubmit()
        }}
      >
        <SelectTrigger className="h-8 w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {IT_TICKET_PRIORITIES.map(p => (
            <SelectItem key={p} value={p}>{IT_TICKET_PRIORITY_LABELS[p]}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {state?.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  )
}
