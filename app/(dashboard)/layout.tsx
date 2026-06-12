import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/crm/AppSidebar'
import { Toaster } from '@/components/ui/toaster'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        userFullName={profile?.full_name ?? user.email ?? 'Usuario'}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
