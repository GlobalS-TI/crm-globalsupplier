import { ITTicketForm } from '@/components/crm/ITTicketForm'
import { createTicket } from '@/app/(dashboard)/soporte-ti/actions'

export const metadata = { title: 'Nuevo ticket de TI | Supply' }

export default function NuevoTicketPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nuevo ticket de TI</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe el problema; el equipo de TI recibirá una notificación al crearlo.
        </p>
      </div>
      <ITTicketForm action={createTicket} />
    </div>
  )
}
