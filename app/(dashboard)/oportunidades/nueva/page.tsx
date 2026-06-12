import Link from 'next/link'
import type { Route } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OpportunityForm } from '@/components/crm/OpportunityForm'
import { createOpportunity } from '../actions'

export const metadata = { title: 'Nueva oportunidad — CRM Global Supplier' }
export const dynamic = 'force-dynamic'

export default async function NuevaOportunidadPage() {
  const supabase = await createClient()

  const [companiesResult, profilesResult, userResult] = await Promise.all([
    supabase.from('companies').select('id, nombre').order('nombre'),
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.auth.getUser(),
  ])

  const companies     = companiesResult.data ?? []
  const profiles      = profilesResult.data ?? []
  const currentUserId = userResult.data.user?.id ?? ''

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="space-y-1">
        <Link href={'/oportunidades' as Route} className="text-sm text-muted-foreground hover:underline">
          ← Oportunidades
        </Link>
        <h1 className="text-2xl font-bold">Nueva oportunidad</h1>
      </div>

      <OpportunityForm
        action={createOpportunity}
        profiles={profiles}
        companies={companies}
        currentUserId={currentUserId}
        submitLabel="Crear oportunidad"
      />
    </div>
  )
}
