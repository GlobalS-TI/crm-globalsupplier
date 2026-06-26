import { UserRoundSearch } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { LeadSectionRepository, LeadRepository } from '@/lib/repositories/supabase/LeadRepository'
import { ProfileRepository } from '@/lib/repositories/supabase/ProfileRepository'
import { LeadService } from '@/lib/services/LeadService'
import { LeadSectionNav } from '@/components/crm/LeadSectionNav'
import { LeadTable } from '@/components/crm/LeadTable'
import { CreateSectionButton } from '@/components/crm/LeadSectionModal'
import type { AssignableUser } from '@/components/crm/LeadModal'

export const metadata = { title: 'Leads — CRM Global Supplier' }
export const dynamic  = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ sec?: string }>
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const { sec } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const role           = profile?.role ?? ''
  const isLeadsManager = ['marketing', 'director_general'].includes(role)
  const canManageLeads = ['marketing', 'director_general', 'direccion_comercial'].includes(role)

  const svc      = new LeadService(new LeadSectionRepository(), new LeadRepository(), new ProfileRepository())
  const sections = await svc.listSections()
  const leads    = sec ? await svc.listLeadsBySection(sec) : []

  // Users that can be assigned leads (direccion_comercial + vendedor)
  const { data: assignableData } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['vendedor'])
    .eq('is_active', true)
    .order('full_name')

  const assignableUsers: AssignableUser[] = (assignableData ?? []) as AssignableUser[]
  const selectedSection = sections.find(s => s.id === sec) ?? null

  // Generate signed URLs for leads that have a stored file
  const requirementUrls: Record<string, string> = {}
  const leadsWithFile = leads.filter(l => l.requirements_file_path)
  if (leadsWithFile.length > 0) {
    const { data: signedData } = await supabase.storage
      .from('media')
      .createSignedUrls(
        leadsWithFile.map(l => l.requirements_file_path!),
        3600,
      )
    signedData?.forEach((item, i) => {
      if (item.signedUrl) requirementUrls[leadsWithFile[i].id] = item.signedUrl
    })
  }

  return (
    <div className="flex h-full">
      <LeadSectionNav
        sections={sections}
        selectedId={sec}
        isLeadsManager={isLeadsManager}
      />

      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">Leads</h1>
          {isLeadsManager && <CreateSectionButton />}
        </div>

        {!sec ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
            <UserRoundSearch className="h-10 w-10 opacity-30" />
            <p className="text-sm">Selecciona una sección para ver los leads</p>
          </div>
        ) : (
          <LeadTable
            leads={leads}
            section={selectedSection}
            sectionId={sec}
            canManageLeads={canManageLeads}
            isLeadsManager={isLeadsManager}
            assignableUsers={assignableUsers}
            requirementUrls={requirementUrls}
          />
        )}
      </div>
    </div>
  )
}
