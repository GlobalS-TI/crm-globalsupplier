'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { completeActivity, deleteActivity } from '@/app/(dashboard)/actividades/actions'
import type { ActivityWithOpportunity } from '@/lib/repositories/interfaces/IActivityRepository'

const TYPE_LABELS: Record<string, string> = {
  llamada: 'Llamada', email: 'Email', reunion: 'Reunión', demo: 'Demo',
  propuesta: 'Propuesta', seguimiento: 'Seguimiento', otro: 'Otro',
}

interface Props {
  act: ActivityWithOpportunity
}

export function ActivityCard({ act }: Props) {
  const fecha  = new Date(act.fecha)
  const isOver = fecha < new Date()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [, startTransition] = useTransition()

  function handleDeleteConfirm() {
    setConfirmOpen(false)
    startTransition(async () => { await deleteActivity(act.id, act.opportunity_id) })
  }

  return (
    <>
    <div className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${isOver ? 'border-destructive/50 bg-destructive/5' : 'bg-card'}`}>
      <div className={`mt-0.5 shrink-0 ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
        {isOver ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">{TYPE_LABELS[act.tipo]}</span>
          <span className={`text-xs font-medium ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
            {fecha.toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
            {' '}
            {fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <p className="text-sm font-medium truncate">{act.titulo}</p>
        {act.opportunity && (
          <Link
            href={`/oportunidades/${act.opportunity.id}` as Route}
            className="text-xs text-primary hover:underline truncate block"
          >
            {act.opportunity.nombre}
          </Link>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <form action={async () => { await completeActivity(act.id, act.opportunity_id) }}>
          <button type="submit" title="Completar" className="text-primary hover:opacity-70">
            <CheckCircle2 className="h-4 w-4" />
          </button>
        </form>
        <button
          type="button"
          title="Eliminar"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">{act.titulo}</span> — Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
