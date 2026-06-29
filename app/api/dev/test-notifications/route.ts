import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  notifyLeadAssigned,
  notifyLeadConverted,
  notifyOppClosed,
  notifyStaleDigest,
} from '@/lib/notifications/send'

// Solo disponible en desarrollo
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const userId = user.id
  const fakeLeadId  = '00000000-0000-0000-0000-000000000001'
  const fakeOppId   = '00000000-0000-0000-0000-000000000002'

  await Promise.allSettled([
    notifyLeadAssigned({
      recipientId:    userId,
      leadId:         fakeLeadId,
      leadName:       'Grupo Industrial Reyes SA de CV',
      sectionName:    'Prospectos Q3',
      assignedByName: 'Ana García (test)',
    }),
    notifyLeadConverted({
      recipientIds:    [userId],
      leadId:          fakeLeadId,
      leadName:        'Grupo Industrial Reyes SA de CV',
      oppId:           fakeOppId,
      oppNombre:       'Suministro EPP — Grupo Reyes 2026',
      convertedByName: 'Carlos López (test)',
    }),
    notifyOppClosed({
      recipientIds: [userId],
      oppId:        fakeOppId,
      oppNombre:    'Suministro EPP — Grupo Reyes 2026',
      etapa:        'ganado',
      vendedorName: 'María Hernández (test)',
      montoFinal:   185000,
    }),
    notifyOppClosed({
      recipientIds: [userId],
      oppId:        fakeOppId,
      oppNombre:    'Mantenimiento Industrial — Aceros del Norte',
      etapa:        'perdido',
      vendedorName: 'Pedro Martínez (test)',
    }),
    notifyStaleDigest({
      recipientIds: [userId],
      opps: [
        { nombre: 'Proyecto Señalización Planta Monterrey', owner: 'María Hernández', etapa: 'cotizacion_enviada' },
        { nombre: 'Suministro Calzado de Seguridad Q4',    owner: 'Carlos López',    etapa: 'seguimiento' },
        { nombre: 'Extintores Torre Empresarial',           owner: 'Pedro Martínez',  etapa: 'negociacion' },
      ],
    }),
  ])

  return NextResponse.json({ ok: true, inserted: 5, userId })
}
