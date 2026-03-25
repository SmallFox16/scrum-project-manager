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
  onAssign: (taskId: string, assigneeId: string | undefined) => void;
  onDelete: (taskId: string) => void;
  isDeleting: boolean;
}

interface SortableTaskItemProps {
  task: Task;
  projectId: string;
  onStatusChange: (taskId: string, newStatus: TaskStatus, completedAt?: string) => void;
  onAssign: (taskId: string, assigneeId: string | undefined) => void;
  onDelete: (taskId: string) => void;
  isDeleting: boolean;
}

function SortableTaskItem({ task, projectId, onStatusChange, onAssign, onDelete, isDeleting }: SortableTaskItemProps) {
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
          onStatusChange={onStatusChange}
          onAssign={onAssign}
          onDelete={onDelete}
          isDeleting={isDeleting}
          isProductBacklog
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
  onDelete,
  isDeleting,
}: DraggableTaskListProps) {
  const [orderedTasks, setOrderedTasks] = useState<Task[]>(tasks)

  // Sync when tasks prop changes (e.g. after server refetch)
  if (tasks.length !== orderedTasks.length || tasks.some((t, i) => t.id !== orderedTasks[i]?.id)) {
    setOrderedTasks(tasks)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      setOrderedTasks((prev) => {
        const oldIndex = prev.findIndex((t) => t.id === active.id)
        const newIndex = prev.findIndex((t) => t.id === over.id)
        const newOrder = arrayMove(prev, oldIndex, newIndex)

        // Save new order to backend
        reorderTasks(newOrder.map((t) => t.id)).catch(() => {
          // Revert on error
          setOrderedTasks(prev)
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
          {orderedTasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              projectId={projectId}
              onStatusChange={onStatusChange}
              onAssign={onAssign}
              onDelete={onDelete}
              isDeleting={isDeleting}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}

export default DraggableTaskList
