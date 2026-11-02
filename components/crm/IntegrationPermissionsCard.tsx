'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { BRAND_LABELS } from '@/lib/types'
import { formatBusinessDateTime } from '@/lib/utils/date'
import { updateIntegrationPermissions } from '@/app/(dashboard)/integraciones/actions'
import type { IntegrationClientSummary } from '@/lib/repositories/interfaces/IIntegrationAdminRepository'

interface PermissionToggleProps {
  id:          string
  label:       string
  description: string
  checked:     boolean
  disabled?:   boolean
  onChange:    (checked: boolean) => void
}

function PermissionToggle({ id, label, description, checked, disabled, onChange }: PermissionToggleProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-3', disabled && 'opacity-50')}>
      <div className="space-y-0.5">
        <label htmlFor={id} className="text-sm font-medium">{label}</label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed',
          checked ? 'bg-primary' : 'bg-muted-foreground/30',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-background shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

interface IntegrationPermissionsCardProps {
  client: IntegrationClientSummary
}

export function IntegrationPermissionsCard({ client }: IntegrationPermissionsCardProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()
  const [analytics, setAnalytics] = useState(client.canReadAnalytics)
  const [contactPii, setContactPii] = useState(client.canReadContactPii)

  function save(next: { analytics: boolean; contactPii: boolean }) {
    const previous = { analytics, contactPii }
    // Apagar análisis apaga también los datos de contacto (misma regla que el servicio).
    const effectivePii = next.analytics && next.contactPii
    setAnalytics(next.analytics)
    setContactPii(effectivePii)

    startTransition(async () => {
      const result = await updateIntegrationPermissions({
        client_id:            client.id,
        can_read_analytics:   next.analytics,
        can_read_contact_pii: effectivePii,
      })
      if (result.error) {
        setAnalytics(previous.analytics)
        setContactPii(previous.contactPii)
        toast({ title: 'No se guardó el cambio', description: result.error, variant: 'destructive' })
      } else {
        toast({ title: 'Permisos actualizados', description: client.nombre })
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="text-base">{client.nombre}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{BRAND_LABELS[client.businessUnit]}</Badge>
            <Badge variant={client.activa ? 'secondary' : 'destructive'} className="text-xs">
              {client.activa ? 'Key activa' : 'Sin key activa'}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {client.keyPrefix ? <>Key <code>{client.keyPrefix}…</code> · </> : null}
          {client.lastUsedAt ? `Último uso ${formatBusinessDateTime(client.lastUsedAt)}` : 'Sin uso registrado'}
        </p>
      </CardHeader>

      <CardContent className="divide-y">
        <PermissionToggle
          id={`analytics-${client.id}`}
          label="Acceso de análisis"
          description="Puede leer oportunidades e indicadores de todas las unidades, sólo lectura. No modifica nada ni envía mensajes."
          checked={analytics}
          disabled={isPending}
          onChange={v => save({ analytics: v, contactPii })}
        />
        <PermissionToggle
          id={`pii-${client.id}`}
          label="Ver email y teléfono de contactos"
          description="Incluye email, teléfono y celular en el acceso de análisis. Apagado, esos campos se envían vacíos."
          checked={contactPii}
          disabled={isPending || !analytics}
          onChange={v => save({ analytics, contactPii: v })}
        />
        {client.permissionsUpdatedAt && (
          <p className="pt-3 text-xs text-muted-foreground">
            Último cambio: {client.permissionsUpdatedBy ?? 'desconocido'} · {formatBusinessDateTime(client.permissionsUpdatedAt)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
