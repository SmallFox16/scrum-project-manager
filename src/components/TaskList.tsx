import { useState, useMemo, useCallback } from 'react'
import { useParams, useOutletContext } from 'react-router-dom'
import { TaskItem } from './TaskItem'
import { TaskSearchInput } from './TaskSearchInput'
import { AddTaskForm } from './AddTaskForm'
import { DraggableTaskList } from './DraggableTaskList'
import { ErrorBoundary } from './ErrorBoundary'
import { useUpdateTask } from '../hooks/mutations/useUpdateTask'
import { useDeleteTask } from '../hooks/mutations/useDeleteTask'
import type { Task, TaskStatus, TaskAssignee } from '../types'
import type { ProjectDetailOutletContext } from '../pages/ProjectDetailPanel'
import { useCanEdit } from '../hooks/useCanEdit'

interface TaskListProps {
  initialTasks?: Task[];
}

export function TaskList({ initialTasks }: TaskListProps) {
  const { projectId } = useParams<{ projectId: string }>();

  const ctx = useOutletContext<ProjectDetailOutletContext | undefined>();
  const tasks = initialTasks ?? ctx?.tasks ?? [];
  const isProductBacklog = ctx?.isProductBacklog ?? false;

  const [searchQuery, setSearchQuery] = useState('');
  const canEdit = useCanEdit();

  const updateTaskMutation = useUpdateTask(projectId ?? '');
  const deleteTaskMutation = useDeleteTask(projectId ?? '');

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter((t) => t.title.toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  const handleStatusChange = useCallback(
    (taskId: string, newStatus: TaskStatus, completedAt?: string) => {
      updateTaskMutation.mutate({ taskId, data: { status: newStatus, completedAt } });
    },
    [updateTaskMutation],
  );

  const handleAssign = useCallback(
    (taskId: string, assignees: TaskAssignee[]) => {
      updateTaskMutation.mutate({ taskId, data: { assignees } });
    },
    [updateTaskMutation],
  );

  const handleEdit = useCallback(
    (taskId: string, data: Partial<Task>) => {
      updateTaskMutation.mutate({ taskId, data });
    },
    [updateTaskMutation],
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      deleteTaskMutation.mutate(taskId);
    },
    [deleteTaskMutation],
  );

  return (
    <div className="task-list">
      <h3 className="task-list__heading">Tasks</h3>

      <div className="task-list__search">
        <TaskSearchInput value={searchQuery} onChange={setSearchQuery} />
        {searchQuery.trim() !== '' && (
          <span className="task-list__search-count">
            {filteredTasks.length} of {tasks.length} tasks
          </span>
        )}
      </div>

      {filteredTasks.length === 0 && tasks.length > 0 ? (
        <p className="task-list__empty">
          No tasks match &ldquo;{searchQuery}&rdquo;.
        </p>
      ) : filteredTasks.length === 0 ? (
        <p className="task-list__empty">No tasks for this project yet.</p>
      ) : isProductBacklog && canEdit ? (
        <DraggableTaskList
          tasks={filteredTasks}
          projectId={projectId ?? ''}
          onStatusChange={handleStatusChange}
          onAssign={handleAssign}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={deleteTaskMutation.isPending}
        />
      ) : (
        <ul className="task-list__items">
          {filteredTasks.map((task) => (
            <li key={task.id}>
              <TaskItem
                task={task}
                projectId={projectId ?? ''}
                onStatusChange={handleStatusChange}
                onAssign={handleAssign}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deleteTaskMutation.isPending}
                isProductBacklog={isProductBacklog}
              />
            </li>
          ))}
        </ul>
      )}

      {canEdit && (
        <ErrorBoundary>
          <AddTaskForm
            projectId={projectId ?? ''}
            isProductBacklog={isProductBacklog}
          />
        </ErrorBoundary>
      )}
    </div>
  )
}

export default TaskList
