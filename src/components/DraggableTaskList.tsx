import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskItem } from './TaskItem'
import { reorderTasks } from '../api/tasks'
import type { Task, TaskStatus } from '../types'

interface DraggableTaskListProps {
  tasks: Task[];
  projectId: string;
  onStatusChange: (taskId: string, newStatus: TaskStatus, completedAt?: string) => void;
  onAssign: (taskId: string, assignees: import('../types').TaskAssignee[]) => void;
  onEdit: (taskId: string, data: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  isDeleting: boolean;
  isProductBacklog?: boolean;
}

interface SortableTaskItemProps {
  task: Task;
  projectId: string;
  itemNumber: number;
  onStatusChange: (taskId: string, newStatus: TaskStatus, completedAt?: string) => void;
  onAssign: (taskId: string, assignees: import('../types').TaskAssignee[]) => void;
  onEdit: (taskId: string, data: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  isDeleting: boolean;
  isProductBacklog?: boolean;
}

function SortableTaskItem({ task, projectId, itemNumber, onStatusChange, onAssign, onEdit, onDelete, isDeleting, isProductBacklog = false }: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <li ref={setNodeRef} style={style} className="draggable-task-item">
      <div className="draggable-task-item__handle" {...attributes} {...listeners} title="Drag to reorder">
        &#9776;
      </div>
      <div className="draggable-task-item__content">
        <TaskItem
          task={task}
          projectId={projectId}
          itemNumber={itemNumber}
          onStatusChange={onStatusChange}
          onAssign={onAssign}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={isDeleting}
          isProductBacklog={isProductBacklog}
        />
      </div>
    </li>
  )
}

export function DraggableTaskList({
  tasks,
  projectId,
  onStatusChange,
  onAssign,
  onEdit,
  onDelete,
  isDeleting,
  isProductBacklog = false,
}: DraggableTaskListProps) {
  const [orderedIds, setOrderedIds] = useState<string[]>(() => tasks.map((t) => t.id))

  // Build a lookup so we always use fresh task data from props
  const taskMap = new Map(tasks.map((t) => [t.id, t]))

  // Sync ordered IDs when tasks are added or removed
  if (
    tasks.length !== orderedIds.length ||
    tasks.some((t) => !orderedIds.includes(t.id))
  ) {
    setOrderedIds(tasks.map((t) => t.id))
  }

  // Derive the rendered list: local order + fresh task data from props
  const orderedTasks = orderedIds
    .map((id) => taskMap.get(id))
    .filter((t): t is Task => t !== undefined)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setOrderedIds((prev) => {
        const oldIndex = prev.indexOf(String(active.id))
        const newIndex = prev.indexOf(String(over.id))
        const newOrder = arrayMove(prev, oldIndex, newIndex)

        // Save new order to backend
        reorderTasks(newOrder).catch(() => {
          // Revert on error
          setOrderedIds(prev)
        })

        return newOrder
      })
    },
    [],
  )

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul className="task-list__items task-list__items--draggable">
          {orderedTasks.map((task, index) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              projectId={projectId}
              itemNumber={index + 1}
              onStatusChange={onStatusChange}
              onAssign={onAssign}
              onEdit={onEdit}
              onDelete={onDelete}
              isDeleting={isDeleting}
              isProductBacklog={isProductBacklog}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

export default DraggableTaskList
