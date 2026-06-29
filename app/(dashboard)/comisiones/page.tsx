import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ComisionesRepository } from '@/lib/repositories/supabase/ComisionesRepository'
import { ComisionesService } from '@/lib/services/ComisionesService'
import { ComisionesTable } from '@/components/crm/ComisionesTable'

export const metadata = { title: 'Comisiones — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

const ALLOWED_ROLES = ['director_general', 'administracion']

interface Props {
  searchParams: Promise<{ year?: string }>
}

export default async function ComisionesPage({ searchParams }: Props) {
  const params  = await searchParams
  const year    = Number(params.year) || new Date().getFullYear()
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!ALLOWED_ROLES.includes(profile?.role ?? '')) redirect('/dashboard')

  const service = new ComisionesService(new ComisionesRepository())
  const { rows, summary } = await service.getComisionesData(year)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i)

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Comisiones y utilidad</h1>
      <ComisionesTable
        key={year}
        rows={rows}
        summary={summary}
        year={year}
        years={years}
      />
    </div>
  )
}
