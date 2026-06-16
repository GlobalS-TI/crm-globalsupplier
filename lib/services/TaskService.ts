import type { ITaskRepository, BoardWithColumns, TaskWithValues, TaskBoardColumnRow, TaskGroupRow, TaskRow } from '@/lib/repositories/interfaces/ITaskRepository'
import type { CreateTaskInput, UpdateTaskInput, CreateBoardColumnInput, UpdateBoardColumnInput, ColumnConfig } from '@/lib/validations/task'
import { createTaskSchema, updateTaskSchema, createBoardColumnSchema, updateBoardColumnSchema, upsertColumnValueSchema } from '@/lib/validations/task'
import type { Json } from '@/lib/types/database'

export class TaskService {
  constructor(private readonly repo: ITaskRepository) {}

  async getOrCreateDefaultBoard(userId: string): Promise<BoardWithColumns> {
    return this.repo.findOrCreateDefaultBoard(userId)
  }

  async getGroupsByBoard(boardId: string): Promise<TaskGroupRow[]> {
    return this.repo.findGroupsByBoard(boardId)
  }

  async getTasksByBoard(boardId: string): Promise<TaskWithValues[]> {
    return this.repo.findTasksByBoard(boardId)
  }

  async createGroup(boardId: string, nombre: string, color: string, position: number): Promise<TaskGroupRow> {
    return this.repo.createGroup(boardId, nombre.trim(), color, position)
  }

  async updateGroup(id: string, data: { nombre?: string; color?: string; position?: number }): Promise<TaskGroupRow> {
    return this.repo.updateGroup(id, data)
  }

  async deleteGroup(id: string): Promise<void> {
    return this.repo.deleteGroup(id)
  }

  async createTask(raw: CreateTaskInput & { created_by: string; group_id?: string }): Promise<TaskRow> {
    const data = createTaskSchema.parse(raw)
    return this.repo.createTask({ ...data, created_by: raw.created_by, group_id: raw.group_id })
  }

  async updateTask(id: string, raw: UpdateTaskInput & { group_id?: string | null }): Promise<TaskRow> {
    const data = updateTaskSchema.parse(raw)
    return this.repo.updateTask(id, { ...data, group_id: raw.group_id })
  }

  async deleteTask(id: string): Promise<void> {
    return this.repo.deleteTask(id)
  }

  async setColumnValue(taskId: string, columnId: string, value: string | null): Promise<void> {
    upsertColumnValueSchema.parse({ task_id: taskId, column_id: columnId, value })
    return this.repo.upsertColumnValue(taskId, columnId, value)
  }

  async addColumn(raw: CreateBoardColumnInput): Promise<TaskBoardColumnRow> {
    const data = createBoardColumnSchema.parse(raw)
    return this.repo.addColumn(data)
  }

  async updateColumn(id: string, raw: UpdateBoardColumnInput & { config?: ColumnConfig }): Promise<TaskBoardColumnRow> {
    const { config: rawConfig, ...rest } = updateBoardColumnSchema.parse(raw)
    const config = rawConfig !== undefined ? (rawConfig as unknown as Json) : undefined
    return this.repo.updateColumn(id, { ...rest, config })
  }

  async deleteColumn(id: string): Promise<void> {
    return this.repo.deleteColumn(id)
  }

  async reorderColumns(boardId: string, orderedIds: string[]): Promise<void> {
    return this.repo.reorderColumns(boardId, orderedIds)
  }
}
