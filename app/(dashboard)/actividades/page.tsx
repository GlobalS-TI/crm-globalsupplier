import { createClient } from '@/lib/supabase/server'
import { TaskRepository } from '@/lib/repositories/supabase/TaskRepository'
import { TaskService } from '@/lib/services/TaskService'
import { TaskBoard } from '@/components/crm/TaskBoard'

export const metadata = { title: 'Actividades — CRM Global Supplier' }
export const dynamic = 'force-dynamic'

export default async function ActividadesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const service = new TaskService(new TaskRepository())
  const board = await service.getOrCreateDefaultBoard(user.id)

  const [groups, tasks, profilesResult] = await Promise.all([
    service.getGroupsByBoard(board.id),
    service.getTasksByBoard(board.id),
    supabase.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name'),
  ])

  const users = (profilesResult.data ?? []) as { id: string; full_name: string; email: string }[]

  return (
    <div className="flex flex-col h-full">
      <TaskBoard
        board={board}
        initialGroups={groups}
        initialTasks={tasks}
        users={users}
        currentUserId={user.id}
      />
    </div>
  )
}
