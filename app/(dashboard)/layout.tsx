import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/crm/AppSidebar'
import { PageTransition } from '@/components/crm/PageTransition'
import { Toaster } from '@/components/ui/toaster'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, is_active, role')
    .eq('id', user.id)
    .single()

  if (!profile?.is_active) redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar
        userFullName={profile?.full_name ?? user.email ?? 'Usuario'}
        userEmail={user.email ?? ''}
        userRole={profile?.role ?? 'vendedor'}
      />
      <main className="flex-1 overflow-y-auto bg-background">
        <PageTransition>{children}</PageTransition>
      </main>
      <Toaster />
    </div>
  )
}
