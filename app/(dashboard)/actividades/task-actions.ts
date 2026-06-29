'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { TaskRepository } from '@/lib/repositories/supabase/TaskRepository'
import { TaskService } from '@/lib/services/TaskService'
import type { UpdateTaskInput, CreateBoardColumnInput, UpdateBoardColumnInput, ColumnConfig, ImportTaskRow } from '@/lib/validations/task'

function makeService() {
  return new TaskService(new TaskRepository())
}

async function getCurrentUserId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return user.id
}

export async function createGroup(boardId: string, nombre: string, color: string, position: number): Promise<{ id: string; nombre: string; color: string; position: number; board_id: string; created_at: string } | { error: string }> {
  try {
    const group = await makeService().createGroup(boardId, nombre, color, position)
    revalidatePath('/actividades')
    return group
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateGroup(groupId: string, data: { nombre?: string; color?: string }): Promise<{ error?: string }> {
  try {
    await makeService().updateGroup(groupId, data)
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteGroup(groupId: string): Promise<{ error?: string }> {
  try {
    await makeService().deleteGroup(groupId)
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function createTask(boardId: string, titulo: string, groupId?: string): Promise<{ id: string } | { error: string }> {
  try {
    const userId = await getCurrentUserId()
    const task = await makeService().createTask({
      board_id:   boardId,
      titulo,
      created_by: userId,
      group_id:   groupId,
    })
    revalidatePath('/actividades')
    return { id: task.id }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateTask(taskId: string, data: UpdateTaskInput & { group_id?: string | null }): Promise<{ error?: string }> {
  try {
    await makeService().updateTask(taskId, data)
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteTask(taskId: string): Promise<{ error?: string }> {
  try {
    await makeService().deleteTask(taskId)
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function setColumnValue(taskId: string, columnId: string, value: string | null): Promise<{ error?: string }> {
  try {
    await makeService().setColumnValue(taskId, columnId, value)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function addBoardColumn(data: Omit<CreateBoardColumnInput, 'position'> & { position: number }): Promise<{ id: string; error?: string }> {
  try {
    const col = await makeService().addColumn(data)
    revalidatePath('/actividades')
    return { id: col.id }
  } catch (e) {
    return { id: '', error: (e as Error).message }
  }
}

export async function updateColumnConfig(columnId: string, config: ColumnConfig): Promise<{ error?: string }> {
  try {
    await makeService().updateColumn(columnId, { config })
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateBoardColumn(columnId: string, data: UpdateBoardColumnInput & { config?: ColumnConfig }): Promise<{ error?: string }> {
  try {
    await makeService().updateColumn(columnId, data)
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteBoardColumn(columnId: string): Promise<{ error?: string }> {
  try {
    await makeService().deleteColumn(columnId)
    revalidatePath('/actividades')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function reorderBoardColumns(boardId: string, orderedIds: string[]): Promise<{ error?: string }> {
  try {
    await makeService().reorderColumns(boardId, orderedIds)
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function importTasks(
  boardId: string,
  rows: ImportTaskRow[],
  groupId?: string,
): Promise<{ count: number } | { error: string }> {
  try {
    const userId = await getCurrentUserId()
    const count = await makeService().batchImportTasks({ board_id: boardId, group_id: groupId, rows }, userId)
    revalidatePath('/actividades')
    return { count }
  } catch (e) {
    return { error: (e as Error).message }
  }
}
