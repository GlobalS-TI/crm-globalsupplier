import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { OpportunityRepository } from '@/lib/repositories/supabase/OpportunityRepository'
import { OpportunityService } from '@/lib/services/OpportunityService'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM ?? 'CRM Global Supplier <noreply@globalsupplier.dev>'

function staleEmailHtml(opps: { nombre: string; owner: string; etapa: string }[]): string {
  const rows = opps.map(o => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${o.nombre}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${o.owner}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-transform:capitalize">${o.etapa.replace(/_/g, ' ')}</td>
    </tr>`).join('')

  return `<!DOCTYPE html>
<html lang="es">
<body style="font-family:sans-serif;color:#111;background:#f9fafb;padding:24px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:#1d4ed8;padding:20px 24px">
      <h1 style="color:#fff;margin:0;font-size:18px">CRM Global Supplier</h1>
      <p style="color:#bfdbfe;margin:4px 0 0;font-size:13px">Resumen de oportunidades sin actividad</p>
    </div>
    <div style="padding:24px">
      <p style="margin-top:0">Las siguientes <strong>${opps.length}</strong> oportunidades llevan más de 7 días sin actividad:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Oportunidad</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Vendedor</th>
            <th style="padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280">Etapa</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="margin-bottom:0;font-size:13px;color:#6b7280;margin-top:20px">
        Entra al CRM para dar seguimiento a estas oportunidades.
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function sendStaleNotifications(): Promise<{ sent: number; error?: string }> {
  const supabase = await createClient()

  // Get director and comercial emails
  const { data: recipients } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['director_general', 'direccion_comercial'])

  if (!recipients?.length) return { sent: 0 }

  // Get stale opportunities
  const staleOpps = await new OpportunityService(new OpportunityRepository()).listPipeline({ stale: true })
  if (!staleOpps.length) return { sent: 0 }

  // Get recipient emails from auth.users via supabase admin
  const { data: users } = await supabase.auth.admin.listUsers()
  const emailMap = new Map(users?.users.map(u => [u.id, u.email ?? '']) ?? [])

  const oppData = staleOpps.map(o => ({
    nombre: o.nombre,
    owner:  o.owner?.full_name ?? 'Sin asignar',
    etapa:  o.etapa,
  }))

  const html = staleEmailHtml(oppData)
  let sent = 0

  for (const profile of recipients) {
    const email = emailMap.get(profile.id)
    if (!email) continue
    try {
      await resend.emails.send({
        from:    FROM,
        to:      email,
        subject: `⚠️ ${staleOpps.length} oportunidades sin actividad — CRM Global Supplier`,
        html,
      })
      sent++
    } catch {
      // continue with other recipients
    }
  }

  return { sent }
}
