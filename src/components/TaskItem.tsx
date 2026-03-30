// Challenge 26 — Capstone update:
// Uses TeamMemberSelect (searchable combobox) instead of TaskAssignment
// (basic <select>) for Feature 1.

import { memo } from 'react'
import { Link } from 'react-router-dom'
import type { Task, TaskStatus, TaskPriority } from '../types'
import { TaskStatusButton } from './TaskStatusButton'
import { TeamMemberSelect } from './TeamMemberSelect'
import { Toast } from './Toast'
import { Modal } from './Modal'
import { useState, useRef } from 'react'
import { UNDO_WINDOW_MS } from '../hooks/mutations/useDeleteTask'
import { useCanEdit } from '../hooks/useCanEdit'

interface TaskItemProps {
  task: Task;
  projectId: string;
  onStatusChange: (taskId: string, newStatus: TaskStatus, completedAt?: string) => void;
  onAssign: (taskId: string, assignees: import('../types').TaskAssignee[]) => void;
  onEdit: (taskId: string, data: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  isDeleting?: boolean;
  isProductBacklog?: boolean;
}

export const TaskItem = memo(function TaskItem({
  task,
  projectId,
  onStatusChange,
  onAssign,
  onEdit,
  onDelete,
  isDeleting = false,
  isProductBacklog = false,
}: TaskItemProps) {
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editPriority, setEditPriority] = useState<TaskPriority | ''>(task.priority || '');
  const [editTimeEstimate, setEditTimeEstimate] = useState(task.timeEstimate || '');
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canEdit = useCanEdit();

  const isOptimistic = task.id.startsWith('temp-');

  function handleDelete() {
    onDelete(task.id);
    setShowUndoToast(true);
    timerRef.current = setTimeout(() => {
      setShowUndoToast(false);
    }, UNDO_WINDOW_MS);
  }

  function handleUndo() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowUndoToast(false);
  }

  function openEditModal() {
    setEditTitle(task.title);
    setEditPriority(task.priority || '');
    setEditTimeEstimate(task.timeEstimate || '');
    setEditDueDate(task.dueDate || '');
    setShowEditModal(true);
  }

  function handleEditSave() {
    const data: Partial<Task> = {};
    if (editTitle.trim() && editTitle.trim() !== task.title) data.title = editTitle.trim();
    if ((editPriority || undefined) !== task.priority) data.priority = editPriority || undefined;
    if ((editTimeEstimate || undefined) !== task.timeEstimate) data.timeEstimate = editTimeEstimate || undefined;
    if ((editDueDate || undefined) !== task.dueDate) data.dueDate = editDueDate || undefined;
    if (Object.keys(data).length > 0) {
      onEdit(task.id, data);
    }
    setShowEditModal(false);
  }

  return (
    <>
      <div className={`task-item${isOptimistic ? ' task-item--optimistic' : ''}`}>
        <div className="task-item__top">
          {canEdit && (
            <button
              type="button"
              className="task-edit-btn"
              onClick={openEditModal}
              disabled={isOptimistic}
              aria-label={`Edit task: ${task.title}`}
              title="Edit task"
            >
              &#9881;
            </button>
          )}
          <Link
            to={`/projects/${projectId}/tasks/${task.id}`}
            className="task-item__title"
          >
            {task.title}
          </Link>
          <span className={`status-badge status-badge--${task.status}`}>
            {task.status}
          </span>
          {canEdit && (
            <button
              type="button"
              className="task-delete-btn"
              onClick={handleDelete}
              disabled={isDeleting || isOptimistic}
              aria-label={`Delete task: ${task.title}`}
              title="Delete task"
            >
              &#10005;
            </button>
          )}
        </div>

        {/* Meta info: priority, sprint, time estimate, due date */}
        <div className="task-item__meta">
          {task.priority && (
            <span className={`priority-badge priority-badge--${task.priority}`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}
          {isProductBacklog && task.sprintProjectName && (
            <span className="task-item__sprint-badge">
              Sprint: {task.sprintProjectName}
            </span>
          )}
          {task.timeEstimate && (
            <span className="task-item__time-badge">
              Est: {task.timeEstimate}
            </span>
          )}
          {task.dueDate && (
            <span className="task-item__date-badge">
              Due: {task.dueDate}
            </span>
          )}
        </div>

        {canEdit && (
          <div className="task-item__actions">
            <TaskStatusButton
              task={task}
              onStatusChange={onStatusChange}
            />
            <TeamMemberSelect
              taskId={task.id}
              assignees={task.assignees ?? []}
              onAssign={onAssign}
            />
          </div>
        )}
      </div>

      {showUndoToast && (
        <Toast
          message="Task deleted."
          variant="success"
          action={{ label: 'Undo', onClick: handleUndo }}
        />
      )}

      <Modal isOpen={showEditModal} title="Edit Task" onClose={() => setShowEditModal(false)}>
        <div className="task-edit-form">
          <label className="task-edit-form__label">
            Title
            <input
              type="text"
              className="task-edit-form__input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </label>

          <div className="task-edit-form__label">
            Priority
            <div className="task-edit-form__priority-group">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`priority-badge priority-badge--${level}${editPriority === level ? ' priority-badge--selected' : ''}`}
                  onClick={() => setEditPriority(editPriority === level ? '' : level)}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <label className="task-edit-form__label">
            Time Estimate
            <input
              type="text"
              className="task-edit-form__input"
              placeholder="e.g. 3 hours, 2 days"
              value={editTimeEstimate}
              onChange={(e) => setEditTimeEstimate(e.target.value)}
            />
          </label>

          <label className="task-edit-form__label">
            Due Date
            <input
              type="date"
              className="task-edit-form__input"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />
          </label>

          <div className="task-edit-form__actions">
            <button type="button" className="task-edit-form__save" onClick={handleEditSave}>
              Save
            </button>
            <button type="button" className="task-edit-form__cancel" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
})

export default TaskItem
