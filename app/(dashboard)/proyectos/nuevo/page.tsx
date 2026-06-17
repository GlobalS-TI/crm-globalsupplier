import { createClient } from '@/lib/supabase/server'
import { ProjectForm } from '@/components/crm/ProjectForm'
import { createProject } from '@/app/(dashboard)/proyectos/actions'

export const metadata = { title: 'Nuevo proyecto — CRM Global Supplier' }

export default async function NuevoProyectoPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('is_active', true)
    .order('full_name')

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nuevo proyecto</h1>
        <p className="text-sm text-muted-foreground mt-1">El proyecto inicia en estado Incoming.</p>
      </div>
      <ProjectForm action={createProject} profiles={profiles ?? []} />
    </div>
  )
}
