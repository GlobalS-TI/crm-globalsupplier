import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Solo disponible en desarrollo
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const userId = user.id

  // Diagnóstico: verificar que la tabla existe y que el profile también
  const { error: tableError } = await supabaseAdmin
    .from('notifications')
    .select('id')
    .limit(1)

  if (tableError) {
    return NextResponse.json({
      error: 'tabla notifications no existe o no accesible',
      detail: tableError.message,
      hint: 'Corre: pnpm supabase migration up',
    }, { status: 500 })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name')
    .eq('id', userId)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({
      error: 'profile no encontrado para este userId',
      userId,
      detail: profileError?.message,
    }, { status: 500 })
  }

  // Insertar directamente (sin emails) para aislar el problema
  const rows = [
    { recipient_id: userId, type: 'lead_assigned',  title: 'Se te asignó un lead',            body: 'Ana García te asignó "Grupo Industrial Reyes" en Prospectos Q3',          href: '/leads',                payload: {} },
    { recipient_id: userId, type: 'lead_converted', title: 'Lead convertido a oportunidad',    body: 'Carlos López convirtió "Grupo Industrial Reyes" → "Suministro EPP"',      href: '/oportunidades',        payload: {} },
    { recipient_id: userId, type: 'opp_ganada',     title: '🎉 Oportunidad ganada',            body: 'Suministro EPP — María Hernández',                                        href: '/oportunidades',        payload: {} },
    { recipient_id: userId, type: 'opp_perdida',    title: '📉 Oportunidad perdida',           body: 'Mantenimiento Industrial — Pedro Martínez',                               href: '/oportunidades',        payload: {} },
    { recipient_id: userId, type: 'stale_digest',   title: '3 oportunidades sin actividad',    body: 'Proyecto Señalización, Suministro Calzado, Extintores Torre Empresarial', href: '/oportunidades',        payload: { count: 3 } },
  ]

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('notifications')
    .insert(rows)
    .select('id, type')

  if (insertError) {
    return NextResponse.json({
      error: 'insert falló',
      detail: insertError.message,
      userId,
      profile: profile.full_name,
    }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    profile: profile.full_name,
    userId,
    inserted: inserted?.map(r => ({ id: r.id, type: r.type })),
  })
}
