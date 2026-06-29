import type { Database, Json } from '@/lib/types/database'
import type {
  CreateBoardColumnInput, UpdateBoardColumnInput,
  CreateTaskInput, UpdateTaskInput, ImportTaskRow,
} from '@/lib/validations/task'

export type TaskBoardRow        = Database['public']['Tables']['task_boards']['Row']
export type TaskBoardColumnRow  = Database['public']['Tables']['task_board_columns']['Row']
export type TaskGroupRow        = Database['public']['Tables']['task_groups']['Row']
export type TaskRow             = Database['public']['Tables']['tasks']['Row']
export type TaskColumnValueRow  = Database['public']['Tables']['task_column_values']['Row']

export type TaskWithValues = TaskRow & {
  column_values: Record<string, string | null>
}

export type BoardWithColumns = TaskBoardRow & {
  columns: TaskBoardColumnRow[]
}

export interface ITaskRepository {
  findOrCreateDefaultBoard(createdBy: string): Promise<BoardWithColumns>
  findGroupsByBoard(boardId: string): Promise<TaskGroupRow[]>
  findTasksByBoard(boardId: string): Promise<TaskWithValues[]>
  createGroup(boardId: string, nombre: string, color: string, position: number): Promise<TaskGroupRow>
  updateGroup(id: string, data: { nombre?: string; color?: string; position?: number }): Promise<TaskGroupRow>
  deleteGroup(id: string): Promise<void>
  reorderGroups(boardId: string, orderedIds: string[]): Promise<void>
  createTask(data: CreateTaskInput & { created_by: string; group_id?: string }): Promise<TaskRow>
  updateTask(id: string, data: UpdateTaskInput & { group_id?: string | null }): Promise<TaskRow>
  deleteTask(id: string): Promise<void>
  upsertColumnValue(taskId: string, columnId: string, value: string | null): Promise<void>
  addColumn(data: CreateBoardColumnInput): Promise<TaskBoardColumnRow>
  updateColumn(id: string, data: { nombre?: string; position?: number; config?: Json }): Promise<TaskBoardColumnRow>
  deleteColumn(id: string): Promise<void>
  reorderColumns(boardId: string, orderedIds: string[]): Promise<void>
  batchCreateTasks(rows: ImportTaskRow[], boardId: string, createdBy: string, groupId?: string): Promise<number>
}
