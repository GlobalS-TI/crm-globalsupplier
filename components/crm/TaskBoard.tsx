'use client'

import { useState, useTransition, useRef, useCallback } from 'react'
import { ChevronDown, ChevronRight, Plus, Loader2, Pencil, Check, X } from 'lucide-react'
import type { BoardWithColumns, TaskWithValues, TaskBoardColumnRow, TaskGroupRow } from '@/lib/repositories/interfaces/ITaskRepository'
import {
  createTask, updateTask, deleteTask, setColumnValue, deleteBoardColumn,
  createGroup, updateGroup, deleteGroup,
} from '@/app/(dashboard)/actividades/task-actions'
import { TaskBoardCell } from '@/components/crm/TaskBoardCell'
import { TaskBoardAddColumn } from '@/components/crm/TaskBoardAddColumn'
import { TaskImportButton } from '@/components/crm/TaskImportButton'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
type User = { id: string; full_name: string; email: string }

interface Props {
  board:          BoardWithColumns
  initialGroups:  TaskGroupRow[]
  initialTasks:   TaskWithValues[]
  users:          User[]
  currentUserId:  string
}

const GROUP_COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#8b5cf6',
  '#ef4444', '#06b6d4', '#f59e0b', '#ec4899',
]

// ----------------------------------------------------------------
// Column header with delete on hover
// ----------------------------------------------------------------
function ColHeader({ col, onDelete }: { col: TaskBoardColumnRow; onDelete: (id: string) => void }) {
  return (
    <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap border-r border-border/40 last:border-r-0 group/col relative">
      <span>{col.nombre}</span>
      <button
        onClick={() => onDelete(col.id)}
        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-destructive hidden group-hover/col:block leading-none px-0.5"
        title="Eliminar columna"
      >
        ×
      </button>
    </th>
  )
}

// ----------------------------------------------------------------
// Inline "add task" row at bottom of each group
// ----------------------------------------------------------------
function AddTaskRow({ boardId, groupId, columns, onAdd }: {
  boardId:  string
  groupId:  string
  columns:  TaskBoardColumnRow[]
  onAdd:    (task: TaskWithValues) => void
}) {
  const [value, setValue] = useState('')
  const [pending, start]  = useTransition()
  const ref = useRef<HTMLInputElement>(null)

  function submit() {
    const v = value.trim()
    if (!v) return
    start(async () => {
      const result = await createTask(boardId, v, groupId)
      if ('id' in result) {
        onAdd({
          id: result.id, board_id: boardId, titulo: v,
          fecha_entrega: null, group_id: groupId, opportunity_id: null,
          created_by: '', position: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          column_values: {},
        })
        setValue('')
        ref.current?.focus()
      }
    })
  }

  return (
    <tr className="border-t border-border/30">
      <td className="w-8 px-2" />
      <td className="px-3 py-1.5" colSpan={columns.length + 2}>
        <div className="flex items-center gap-2">
          <Plus className="h-3 w-3 text-muted-foreground/50 shrink-0" />
          <input
            ref={ref}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder="+ Agregar actividad"
            disabled={pending}
            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/40"
          />
          {pending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/50" />}
        </div>
      </td>
    </tr>
  )
}

// ----------------------------------------------------------------
// Single task row
// ----------------------------------------------------------------
function TaskRow({ task, columns, users, onTituloSave, onDelete, onCellChange, onOptionsUpdate }: {
  task:            TaskWithValues
  columns:         TaskBoardColumnRow[]
  users:           User[]
  onTituloSave:    (titulo: string) => void
  onDelete:        () => void
  onCellChange:    (columnId: string, value: string | null) => void
  onOptionsUpdate: (columnId: string, opts: import('@/lib/validations/task').SelectorOption[]) => void
}) {
  const [editing,     setEditing]     = useState(false)
  const [titleValue,  setTitleValue]  = useState(task.titulo)
  const [, start] = useTransition()

  function saveTitle() {
    const v = titleValue.trim()
    if (!v || v === task.titulo) { setEditing(false); return }
    start(async () => {
      await updateTask(task.id, { titulo: v })
      onTituloSave(v)
      setEditing(false)
    })
  }

  return (
    <tr className="border-t border-border/20 hover:bg-muted/20 group/row">
      <td className="w-8 px-2 text-center">
        <div className="w-3.5 h-3.5 rounded border border-border mx-auto opacity-0 group-hover/row:opacity-100 transition-opacity" />
      </td>
      <td className="px-3 py-2 border-r border-border/30">
        {editing ? (
          <input
            autoFocus
            value={titleValue}
            onChange={e => setTitleValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') setEditing(false) }}
            className="w-full text-sm bg-transparent border-b border-primary outline-none"
          />
        ) : (
          <span
            className="text-sm cursor-text block leading-snug"
            onDoubleClick={() => setEditing(true)}
            title="Doble clic para editar"
          >
            {task.titulo}
          </span>
        )}
      </td>
      {columns.map(col => (
        <td key={col.id} className="px-1 py-0.5 border-r border-border/20 last:border-r-0">
          <TaskBoardCell
            column={col}
            value={task.column_values[col.id] ?? null}
            users={users}
            taskId={task.id}
            onChange={val => onCellChange(col.id, val)}
            onOptionsUpdate={onOptionsUpdate}
          />
        </td>
      ))}
      <td className="w-8 px-1 text-center">
        <button
          onClick={onDelete}
          className="text-muted-foreground/30 hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-all text-base leading-none px-1"
          title="Eliminar"
        >
          ×
        </button>
      </td>
    </tr>
  )
}

// ----------------------------------------------------------------
// Editable group header name
// ----------------------------------------------------------------
function GroupNameEditor({ group, onSave, onCancel }: {
  group:    TaskGroupRow
  onSave:   (nombre: string) => void
  onCancel: () => void
}) {
  const [value, setValue] = useState(group.nombre)

  function save() {
    const v = value.trim()
    if (!v) { onCancel(); return }
    onSave(v)
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel() }}
        className="text-sm font-semibold bg-transparent border-b border-current outline-none min-w-[120px]"
      />
      <button onClick={save}   className="p-0.5 hover:opacity-70"><Check className="h-3.5 w-3.5" /></button>
      <button onClick={onCancel} className="p-0.5 hover:opacity-70"><X className="h-3.5 w-3.5" /></button>
    </div>
  )
}

// ----------------------------------------------------------------
// Single group section
// ----------------------------------------------------------------
function TaskGroup({
  group, tasks, columns, users, boardId,
  collapsed, onToggle,
  onTaskAdd, onTaskTitleUpdate, onTaskDelete, onCellChange,
  onGroupRename, onGroupDelete, onColumnDelete, onColumnAdded, onOptionsUpdate,
}: {
  group:               TaskGroupRow
  tasks:               TaskWithValues[]
  columns:             TaskBoardColumnRow[]
  users:               User[]
  boardId:             string
  collapsed:           boolean
  onToggle:            () => void
  onTaskAdd:           (task: TaskWithValues) => void
  onTaskTitleUpdate:   (taskId: string, titulo: string) => void
  onTaskDelete:        (taskId: string) => void
  onCellChange:        (taskId: string, colId: string, val: string | null) => void
  onGroupRename:       (groupId: string, nombre: string) => void
  onGroupDelete:       (groupId: string) => void
  onColumnDelete:      (colId: string) => void
  onColumnAdded:       (col: TaskBoardColumnRow) => void
  onOptionsUpdate:     (columnId: string, opts: import('@/lib/validations/task').SelectorOption[]) => void
}) {
  const [editingName, setEditingName] = useState(false)

  return (
    <div className="mb-4">
      {/* Group header bar */}
      <div
        className="flex items-center gap-2 py-1.5 rounded-t-sm group/group"
        style={{ borderLeft: `3px solid ${group.color}`, paddingLeft: '8px' }}
      >
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground shrink-0">
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronDown  className="h-4 w-4" />
          }
        </button>

        {editingName ? (
          <GroupNameEditor
            group={group}
            onSave={nombre => { onGroupRename(group.id, nombre); setEditingName(false) }}
            onCancel={() => setEditingName(false)}
          />
        ) : (
          <span
            className="text-sm font-semibold cursor-pointer hover:underline underline-offset-2"
            style={{ color: group.color }}
            onClick={() => setEditingName(true)}
            title="Clic para renombrar"
          >
            {group.nombre}
          </span>
        )}

        <span className="text-xs text-muted-foreground">({tasks.length})</span>

        <div className="flex items-center gap-1 ml-auto opacity-0 group-hover/group:opacity-100 transition-opacity">
          <button
            onClick={() => setEditingName(true)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            title="Renombrar grupo"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={() => onGroupDelete(group.id)}
            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
            title="Eliminar grupo"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="overflow-x-auto border border-border/40 rounded-b-sm">
          <table className="w-full min-w-max text-sm border-collapse">
            <colgroup>
              <col className="w-8" />
              <col className="min-w-[280px]" />
              {columns.map(c => (
                <col key={c.id} className={c.tipo === 'url' ? 'min-w-[160px]' : 'min-w-[130px]'} />
              ))}
              <col className="w-8" />
            </colgroup>
            <thead>
              <tr className="border-b border-border/40 bg-muted/20">
                <th className="w-8 px-2" />
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide border-r border-border/40">
                  Actividad
                </th>
                {columns.map(col => (
                  <ColHeader key={col.id} col={col} onDelete={onColumnDelete} />
                ))}
                <th className="w-8 px-1 border-l border-border/20">
                  <TaskBoardAddColumn
                    boardId={boardId}
                    nextPosition={columns.length}
                    onColumnAdded={onColumnAdded}
                    compact
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  columns={columns}
                  users={users}
                  onTituloSave={titulo => onTaskTitleUpdate(task.id, titulo)}
                  onDelete={() => onTaskDelete(task.id)}
                  onCellChange={(colId, val) => onCellChange(task.id, colId, val)}
                  onOptionsUpdate={onOptionsUpdate}
                />
              ))}
              <AddTaskRow
                boardId={boardId}
                groupId={group.id}
                columns={columns}
                onAdd={onTaskAdd}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// "Add group" button at the bottom
// ----------------------------------------------------------------
function AddGroupRow({ onAdd }: { onAdd: (nombre: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value,   setValue]   = useState('')
  const ref = useRef<HTMLInputElement>(null)

  function submit() {
    const v = value.trim()
    if (!v) { setEditing(false); return }
    onAdd(v)
    setValue('')
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 0) }}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2 px-1 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Agregar grupo
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 py-1.5 border-l-[3px] border-muted pl-2">
      <input
        ref={ref}
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') { setEditing(false); setValue('') } }}
        placeholder="Nombre del grupo…"
        className="text-sm font-semibold bg-transparent border-b border-muted-foreground outline-none min-w-[180px]"
      />
      <button onClick={submit} className="p-0.5 text-muted-foreground hover:text-foreground"><Check className="h-3.5 w-3.5" /></button>
      <button onClick={() => { setEditing(false); setValue('') }} className="p-0.5 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
    </div>
  )
}

// ----------------------------------------------------------------
// Main TaskBoard
// ----------------------------------------------------------------
export function TaskBoard({ board, initialGroups, initialTasks, users }: Props) {
  const [groups,      setGroups]      = useState<TaskGroupRow[]>(initialGroups)
  const [tasks,       setTasks]       = useState<TaskWithValues[]>(initialTasks)
  const [columns,     setColumns]     = useState(board.columns)
  const [collapsed,   setCollapsed]   = useState<Set<string>>(new Set())
  const [deleteTaskId,  setDeleteTaskId]  = useState<string | null>(null)
  const [deleteColId,   setDeleteColId]   = useState<string | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [, start] = useTransition()

  function toggleCollapse(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
    })
  }

  const handleAddGroup = useCallback((nombre: string) => {
    const color = GROUP_COLORS[groups.length % GROUP_COLORS.length]
    const position = groups.length
    const optimisticId = `temp-${Date.now()}`
    const optimistic: TaskGroupRow = {
      id: optimisticId, board_id: board.id, nombre, color, position,
      created_at: new Date().toISOString(),
    }
    setGroups(prev => [...prev, optimistic])
    start(async () => {
      const result = await createGroup(board.id, nombre, color, position)
      if ('id' in result && result.id && !('error' in result)) {
        setGroups(prev => prev.map(g => g.id === optimisticId ? result as TaskGroupRow : g))
      } else {
        setGroups(prev => prev.filter(g => g.id !== optimisticId))
      }
    })
  }, [board.id, groups.length])

  const handleGroupRename = useCallback((groupId: string, nombre: string) => {
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, nombre } : g))
    start(async () => { await updateGroup(groupId, { nombre }) })
  }, [])

  function confirmDeleteGroup() {
    if (!deleteGroupId) return
    const id = deleteGroupId; setDeleteGroupId(null)
    setGroups(prev => prev.filter(g => g.id !== id))
    setTasks(prev => prev.filter(t => t.group_id !== id))
    start(async () => { await deleteGroup(id) })
  }

  const handleTaskAdd = useCallback((task: TaskWithValues) => {
    setTasks(prev => [...prev, task])
  }, [])

  const handleTitleUpdate = useCallback((taskId: string, titulo: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, titulo } : t))
  }, [])

  const handleCellChange = useCallback((taskId: string, columnId: string, value: string | null) => {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, column_values: { ...t.column_values, [columnId]: value } } : t
    ))
    start(async () => { await setColumnValue(taskId, columnId, value) })
  }, [])

  const handleOptionsUpdate = useCallback((columnId: string, opts: import('@/lib/validations/task').SelectorOption[]) => {
    setColumns(prev => prev.map(c =>
      c.id === columnId ? { ...c, config: { ...(c.config as object), options: opts } } : c
    ))
  }, [])

  function confirmDeleteTask() {
    if (!deleteTaskId) return
    const id = deleteTaskId; setDeleteTaskId(null)
    setTasks(prev => prev.filter(t => t.id !== id))
    start(async () => { await deleteTask(id) })
  }

  function confirmDeleteColumn() {
    if (!deleteColId) return
    const id = deleteColId; setDeleteColId(null)
    setColumns(prev => prev.filter(c => c.id !== id))
    setTasks(prev => prev.map(t => {
      const { [id]: _, ...rest } = t.column_values
      return { ...t, column_values: rest }
    }))
    start(async () => { await deleteBoardColumn(id) })
  }

  // Tasks without a group
  const ungroupedTasks = tasks.filter(t => !t.group_id || !groups.find(g => g.id === t.group_id))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-bold">{board.nombre}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tasks.length} tarea{tasks.length !== 1 ? 's' : ''} · {groups.length} grupo{groups.length !== 1 ? 's' : ''}
          </p>
        </div>
        <TaskImportButton
          boardId={board.id}
          onImported={() => window.location.reload()}
        />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
        {groups.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-sm">No hay grupos todavía.</p>
            <p className="text-xs mt-1">Crea un grupo para empezar a agregar actividades.</p>
          </div>
        )}

        {groups.map(group => (
          <TaskGroup
            key={group.id}
            group={group}
            tasks={tasks.filter(t => t.group_id === group.id)}
            columns={columns}
            users={users}
            boardId={board.id}
            collapsed={collapsed.has(group.id)}
            onToggle={() => toggleCollapse(group.id)}
            onTaskAdd={handleTaskAdd}
            onTaskTitleUpdate={handleTitleUpdate}
            onTaskDelete={id => setDeleteTaskId(id)}
            onCellChange={handleCellChange}
            onGroupRename={handleGroupRename}
            onGroupDelete={id => setDeleteGroupId(id)}
            onColumnDelete={id => setDeleteColId(id)}
            onColumnAdded={col => setColumns(prev => [...prev, col])}
            onOptionsUpdate={handleOptionsUpdate}
          />
        ))}

        {/* Ungrouped tasks (if any) */}
        {ungroupedTasks.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 px-1">Sin grupo ({ungroupedTasks.length})</p>
            <div className="overflow-x-auto border border-border/30 rounded-sm">
              <table className="w-full min-w-max text-sm border-collapse">
                <colgroup>
                  <col className="w-8" />
                  <col className="min-w-[280px]" />
                  {columns.map(c => <col key={c.id} className="min-w-[130px]" />)}
                  <col className="w-8" />
                </colgroup>
                <thead>
                  <tr className="border-b border-border/30 bg-muted/10">
                    <th className="w-8" />
                    <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide border-r border-border/30">Actividad</th>
                    {columns.map(col => (
                      <ColHeader key={col.id} col={col} onDelete={id => setDeleteColId(id)} />
                    ))}
                    <th className="w-8 px-1 border-l border-border/20">
                      <TaskBoardAddColumn
                        boardId={board.id}
                        nextPosition={columns.length}
                        onColumnAdded={col => setColumns(prev => [...prev, col])}
                        compact
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ungroupedTasks.map(task => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      columns={columns}
                      users={users}
                      onTituloSave={titulo => handleTitleUpdate(task.id, titulo)}
                      onDelete={() => setDeleteTaskId(task.id)}
                      onCellChange={(colId, val) => handleCellChange(task.id, colId, val)}
                      onOptionsUpdate={handleOptionsUpdate}
                    />

                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add group */}
        <div className="pt-2">
          <AddGroupRow onAdd={handleAddGroup} />
        </div>
      </div>

      {/* Delete task confirmation */}
      <AlertDialog open={deleteTaskId !== null} onOpenChange={v => { if (!v) setDeleteTaskId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar actividad?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTask} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete column confirmation */}
      <AlertDialog open={deleteColId !== null} onOpenChange={v => { if (!v) setDeleteColId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar columna?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todos los valores de esta columna en todas las actividades.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteColumn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar columna
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete group confirmation */}
      <AlertDialog open={deleteGroupId !== null} onOpenChange={v => { if (!v) setDeleteGroupId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Las actividades de este grupo quedarán sin grupo. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
