import { createClient } from '@/lib/supabase/server'
import { TaskRepository } from '@/lib/repositories/supabase/TaskRepository'
import { TaskService } from '@/lib/services/TaskService'
import { TaskBoard } from '@/components/crm/TaskBoard'
import { DirectorUserList } from '@/components/crm/DirectorUserList'
import { UserActivitiesReadOnly } from '@/components/crm/UserActivitiesReadOnly'

export const metadata = { title: 'Actividades — Supply' }
export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ usuario?: string }>
}

export default async function ActividadesPage({ searchParams }: Props) {
  const { usuario: selectedUserId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isDirectorGeneral = profile?.role === 'director_general'

  const service = new TaskService(new TaskRepository())
  const board = await service.getOrCreateDefaultBoard(user.id)

  const profilesResult = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_active', true)
    .order('full_name')
  const users = (profilesResult.data ?? []) as { id: string; full_name: string; email: string }[]

  if (isDirectorGeneral && !selectedUserId) {
    return (
      <div className="flex flex-col h-full">
        <DirectorUserList users={users} />
      </div>
    )
  }

  if (isDirectorGeneral && selectedUserId) {
    const targetUser = users.find(u => u.id === selectedUserId)
    if (!targetUser) return null

    const [groups, tasks] = await Promise.all([
      service.getGroupsByBoard(board.id),
      service.getTasksByBoardAndUser(board.id, selectedUserId),
    ])

    return (
      <div className="flex flex-col h-full">
        <UserActivitiesReadOnly board={board} groups={groups} tasks={tasks} targetUser={targetUser} users={users} />
      </div>
    )
  }

  const [groups, tasks, buResult] = await Promise.all([
    service.getGroupsByBoard(board.id),
    service.getTasksByBoard(board.id),
    supabase.from('profile_business_units').select('business_unit').eq('profile_id', user.id),
  ])

  const allowedBusinessUnits = (buResult.data ?? []).map(r => r.business_unit)

  return (
    <div className="flex flex-col h-full">
      <TaskBoard
        board={board}
        initialGroups={groups}
        initialTasks={tasks}
        users={users}
        currentUserId={user.id}
        allowedBusinessUnits={allowedBusinessUnits}
      />
    </div>
  )
}
