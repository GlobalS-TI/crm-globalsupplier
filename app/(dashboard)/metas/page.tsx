import { createClient } from '@/lib/supabase/server'
import { SalesTargetRepository } from '@/lib/repositories/supabase/SalesTargetRepository'
import { SalesTargetService } from '@/lib/services/SalesTargetService'
import { SalesTargetsBoard } from '@/components/crm/SalesTargetsBoard'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Metas de venta — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

const DIRECTOR_ROLES = ['director_general', 'direccion_comercial']

interface Props {
  searchParams: Promise<{ year?: string; vendedor?: string }>
}

export default async function MetasPage({ searchParams }: Props) {
  const params  = await searchParams
  const year    = Number(params.year) || new Date().getFullYear()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  const isDirector = DIRECTOR_ROLES.includes(profile?.role ?? '')

  // Load vendedores list — directors see all active vendors, vendedores see only themselves
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('is_active', true)
    .order('full_name')

  const vendors = isDirector
    ? (allProfiles ?? []).filter(p => p.role !== 'marketing' && p.role !== 'administracion')
    : [{ id: user.id, full_name: profile?.full_name ?? '', role: profile?.role ?? '' }]

  // Determine selected vendedor
  const vendedorId = isDirector
    ? (params.vendedor && vendors.some(v => v.id === params.vendedor) ? params.vendedor : vendors[0]?.id ?? user.id)
    : user.id

  const monthlyData = await new SalesTargetService(new SalesTargetRepository())
    .getMonthlyData(vendedorId, year)

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Metas de venta</h1>
      <SalesTargetsBoard
        vendors={vendors}
        selectedVendedorId={vendedorId}
        year={year}
        monthlyData={monthlyData}
        isDirector={isDirector}
      />
    </div>
  )
}
