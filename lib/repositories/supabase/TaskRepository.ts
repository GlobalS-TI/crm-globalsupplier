import { createClient } from '@/lib/supabase/server'
import type {
  ITaskRepository, BoardWithColumns, TaskWithValues,
  TaskBoardColumnRow, TaskGroupRow, TaskRow,
} from '@/lib/repositories/interfaces/ITaskRepository'
import type {
  CreateBoardColumnInput, UpdateBoardColumnInput,
  CreateTaskInput, UpdateTaskInput, ImportTaskRow,
} from '@/lib/validations/task'
import type { Json } from '@/lib/types/database'

const DEFAULT_COLUMNS: Omit<CreateBoardColumnInput, 'board_id'>[] = [
  {
    nombre: 'Marca', tipo: 'business_unit', position: 0, config: {},
  },
  {
    nombre: 'Tipo de actividad', tipo: 'selector', position: 1,
    config: { options: [] },
  },
  {
    nombre: 'Responsable', tipo: 'person', position: 2, config: {},
  },
  {
    nombre: 'Fecha de Inicio', tipo: 'date', position: 3, config: {},
  },
  {
    nombre: 'Estado',    tipo: 'selector', position: 4, config: { options: [] },
  },
  {
    nombre: 'Prioridad', tipo: 'selector', position: 5, config: { options: [] },
  },
  {
    nombre: 'URL', tipo: 'url', position: 6, config: {},
  },
]

export class TaskRepository implements ITaskRepository {
  async findOrCreateDefaultBoard(createdBy: string): Promise<BoardWithColumns> {
    const supabase = await createClient()

    // Look for any existing board
    const { data: existing } = await supabase
      .from('task_boards')
      .select('*, columns:task_board_columns(*)')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (existing) {
      const board = existing as BoardWithColumns & { columns: TaskBoardColumnRow[] }
      board.columns = board.columns.sort((a, b) => a.position - b.position)
      return board
    }

    // Create default board
    const { data: board, error: boardErr } = await supabase
      .from('task_boards')
      .insert({ nombre: 'Actividades Generales', created_by: createdBy })
      .select()
      .single()
    if (boardErr) throw boardErr

    // Seed default columns
    const colInserts = DEFAULT_COLUMNS.map(c => ({
      board_id: board.id,
      nombre:   c.nombre,
      tipo:     c.tipo,
      position: c.position,
      config:   c.config as Json,
    }))
    const { data: cols, error: colErr } = await supabase
      .from('task_board_columns')
      .insert(colInserts)
      .select()
    if (colErr) throw colErr

    return {
      ...board,
      columns: (cols ?? []).sort((a, b) => a.position - b.position),
    }
  }

  async findGroupsByBoard(boardId: string): Promise<TaskGroupRow[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('task_groups')
      .select('*')
      .eq('board_id', boardId)
      .order('position', { ascending: true })
    if (error) throw error
    return data ?? []
  }

  async createGroup(boardId: string, nombre: string, color: string, position: number): Promise<TaskGroupRow> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('task_groups')
      .insert({ board_id: boardId, nombre, color, position })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateGroup(id: string, data: { nombre?: string; color?: string; position?: number }): Promise<TaskGroupRow> {
    const supabase = await createClient()
    const { data: updated, error } = await supabase
      .from('task_groups')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return updated
  }

  async deleteGroup(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('task_groups').delete().eq('id', id)
    if (error) throw error
  }

  async reorderGroups(boardId: string, orderedIds: string[]): Promise<void> {
    const supabase = await createClient()
    await Promise.all(
      orderedIds.map((id, position) =>
        supabase.from('task_groups').update({ position }).eq('id', id).eq('board_id', boardId)
      )
    )
  }

  async findTasksByBoard(boardId: string): Promise<TaskWithValues[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('tasks')
      .select('*, raw_values:task_column_values(column_id, value)')
      .eq('board_id', boardId)
      .order('fecha_entrega', { ascending: true, nullsFirst: false })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data ?? []).map(t => {
      const raw = (t as typeof t & { raw_values: { column_id: string; value: string | null }[] }).raw_values ?? []
      const column_values: Record<string, string | null> = {}
      for (const cv of raw) column_values[cv.column_id] = cv.value
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { raw_values: _, ...task } = t as typeof t & { raw_values: unknown }
      return { ...task, column_values } as TaskWithValues
    })
  }

  async createTask(data: CreateTaskInput & { created_by: string; group_id?: string }): Promise<TaskRow> {
    const supabase = await createClient()
    const { data: task, error } = await supabase
      .from('tasks')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return task
  }

  async updateTask(id: string, data: UpdateTaskInput & { group_id?: string | null }): Promise<TaskRow> {
    const supabase = await createClient()
    const { data: task, error } = await supabase
      .from('tasks')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return task
  }

  async deleteTask(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
  }

  async upsertColumnValue(taskId: string, columnId: string, value: string | null): Promise<void> {
    const supabase = await createClient()
    if (value === null || value === '') {
      await supabase
        .from('task_column_values')
        .delete()
        .eq('task_id', taskId)
        .eq('column_id', columnId)
    } else {
      const { error } = await supabase
        .from('task_column_values')
        .upsert({ task_id: taskId, column_id: columnId, value })
      if (error) throw error
    }
  }

  async addColumn(data: CreateBoardColumnInput): Promise<TaskBoardColumnRow> {
    const supabase = await createClient()
    const { data: col, error } = await supabase
      .from('task_board_columns')
      .insert({ ...data, config: data.config as Json })
      .select()
      .single()
    if (error) throw error
    return col
  }

  async updateColumn(id: string, data: UpdateBoardColumnInput & { config?: Json }): Promise<TaskBoardColumnRow> {
    const supabase = await createClient()
    const { data: col, error } = await supabase
      .from('task_board_columns')
      .update(data)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return col
  }

  async deleteColumn(id: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase.from('task_board_columns').delete().eq('id', id)
    if (error) throw error
  }

  async reorderColumns(boardId: string, orderedIds: string[]): Promise<void> {
    const supabase = await createClient()
    const updates = orderedIds.map((id, position) =>
      supabase.from('task_board_columns').update({ position }).eq('id', id).eq('board_id', boardId)
    )
    await Promise.all(updates)
  }

  async batchCreateTasks(rows: ImportTaskRow[], boardId: string, createdBy: string, groupId?: string): Promise<number> {
    const supabase = await createClient()
    const inserts = rows.map((r, i) => ({
      board_id:      boardId,
      titulo:        r.titulo,
      fecha_entrega: r.fecha_entrega ?? null,
      created_by:    createdBy,
      group_id:      groupId ?? null,
      position:      i,
    }))
    const { data, error } = await supabase.from('tasks').insert(inserts).select('id')
    if (error) throw error
    return data?.length ?? 0
  }
}
