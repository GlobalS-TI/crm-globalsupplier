export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { ProfileRepository } from '@/lib/repositories/supabase/ProfileRepository'
import { UserTable } from '@/components/crm/admin/UserTable'
import { CreateUserDialog } from '@/components/crm/admin/CreateUserDialog'

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const users = await new ProfileRepository().findAll()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} {users.length === 1 ? 'usuario registrado' : 'usuarios registrados'}
          </p>
        </div>
        <CreateUserDialog />
      </div>

      <UserTable users={users} currentUserId={user!.id} />
    </div>
  )
}
