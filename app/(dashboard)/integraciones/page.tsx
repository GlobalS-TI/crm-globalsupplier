import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IntegrationAdminRepository } from '@/lib/repositories/supabase/IntegrationAdminRepository'
import { IntegrationAdminService } from '@/lib/services/IntegrationAdminService'
import { IntegrationPermissionsCard } from '@/components/crm/IntegrationPermissionsCard'
import { INTEGRATION_ADMIN_ROLES } from '@/lib/types'
import type { UserRole } from '@/lib/types'

export const metadata = { title: 'Integraciones | Supply' }
export const dynamic = 'force-dynamic'

export default async function IntegracionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (!INTEGRATION_ADMIN_ROLES.includes((profile?.role ?? '') as UserRole)) redirect('/dashboard')

  const clients = await new IntegrationAdminService(new IntegrationAdminRepository()).listClients()

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Integraciones</h1>
        <p className="text-sm text-muted-foreground">
          Qué pueden leer los sistemas externos. Las API keys, límites de llamadas y altas siguen
          administrándose desde TI.
        </p>
      </div>

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay integraciones dadas de alta.</p>
      ) : (
        clients.map(c => <IntegrationPermissionsCard key={c.id} client={c} />)
      )}
    </div>
  )
}
