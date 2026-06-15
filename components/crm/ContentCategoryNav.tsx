'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { Folder, Trash2, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ICON_MAP } from '@/components/crm/IconPicker'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { CreateCategoryButton, EditCategoryButton } from '@/components/crm/ContentCategoryModal'
import { deleteCategory, reorderCategories } from '@/app/(dashboard)/contenido/actions'
import type { ContentCategoryRow } from '@/lib/repositories/interfaces/IContentRepository'


function DeleteCategoryButton({ category }: { category: ContentCategoryRow }) {
  const [pending, start] = useTransition()

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          disabled={pending}
          className="p-1 rounded hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Trash2 className="h-3 w-3 text-muted-foreground" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
          <AlertDialogDescription>
            Se eliminarán todos los elementos y archivos de &quot;{category.nombre}&quot;. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => start(async () => { await deleteCategory(category.id) })}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {pending ? 'Eliminando…' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface ItemProps {
  cat:              ContentCategoryRow
  selectedId:       string | undefined
  isContentManager: boolean
}

function SortableCategoryItem({ cat, selectedId, isContentManager }: ItemProps) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const Icon     = ICON_MAP[cat.icono ?? ''] ?? Folder
  const isActive = cat.id === selectedId

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-1">
      {isContentManager && (
        <button
          {...attributes}
          {...listeners}
          tabIndex={-1}
          className="p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}

      <Link
        href={`/contenido?cat=${cat.id}`}
        className={cn(
          'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors min-w-0',
          isActive
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="truncate">{cat.nombre}</span>
      </Link>

      {isContentManager && (
        <div className="flex items-center shrink-0">
          <EditCategoryButton category={cat} />
          <DeleteCategoryButton category={cat} />
        </div>
      )}
    </div>
  )
}

interface Props {
  categories:       ContentCategoryRow[]
  selectedId:       string | undefined
  isContentManager: boolean
}

export function ContentCategoryNav({ categories, selectedId, isContentManager }: Props) {
  const [items, setItems]   = useState(categories)
  const [, startTransition] = useTransition()

  useEffect(() => { setItems(categories) }, [categories])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex(c => c.id === active.id)
    const newIndex = items.findIndex(c => c.id === over.id)
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    startTransition(async () => { await reorderCategories(next.map(c => c.id)) })
  }

  return (
    <aside className="w-56 shrink-0 border-r h-full overflow-y-auto bg-card flex flex-col">
      <div className="flex-1 px-3 py-4 space-y-0.5">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {items.map(cat => (
              <SortableCategoryItem
                key={cat.id}
                cat={cat}
                selectedId={selectedId}
                isContentManager={isContentManager}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {isContentManager && (
        <div className="border-t px-3 py-2">
          <CreateCategoryButton />
        </div>
      )}
    </aside>
  )
}
