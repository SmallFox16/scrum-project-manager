import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useOutletContext } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { TEAM_MEMBERS } from '../data/team'
import { fetchSubtasks, createSubtask, updateSubtask, deleteSubtask } from '../api/tasks'
import { useQueryClient } from '@tanstack/react-query'
import type { Task, SubTask, SubTaskStatus } from '../types'
import type { ProjectDetailOutletContext } from './ProjectDetailPanel'
import { useCanEdit } from '../hooks/useCanEdit'

const SUBTASK_STATUSES: SubTaskStatus[] = ['Todo', 'InProgress', 'InReview', 'Done']

export function TaskDetail() {
  const { projectId, taskId } = useParams<{ projectId: string; taskId: string }>();
  const ctx = useOutletContext<ProjectDetailOutletContext | undefined>();

  if (projectId === undefined || taskId === undefined) {
    return (
      <div className="task-detail">
        <p>Invalid URL: missing project or task ID.</p>
      </div>
    );
  }

  const task = ctx?.tasks.find((t) => t.id === taskId);

  if (task === undefined) {
    return (
      <div className="task-detail">
        <Link to={`/projects/${projectId}`} className="task-detail__back">
          <span className="task-detail__back-arrow">&#8592;</span>
          Back to tasks
        </Link>
        <p>No task found with ID: <code>{taskId}</code></p>
      </div>
    );
  }

  return <TaskDetailContent projectId={projectId} task={task} />;
}

interface TaskDetailContentProps {
  projectId: string;
  task: Task;
}

function TaskDetailContent({ projectId, task }: TaskDetailContentProps) {
  const member = TEAM_MEMBERS.find((m) => m.id === task.assigneeId);
  const canEdit = useCanEdit();
  const queryClient = useQueryClient();

  useDocumentTitle(`${task.title} | Scrum Project Manager`);

  // Subtask state
  const [subtasks, setSubtasks] = useState<SubTask[]>(task.subtasks ?? []);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const loadSubtasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSubtasks(task.id);
      setSubtasks(data);
    } catch {
      // keep existing
    } finally {
      setLoading(false);
    }
  }, [task.id]);

  useEffect(() => {
    loadSubtasks();
  }, [loadSubtasks]);

  async function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    try {
      await createSubtask(task.id, {
        title: newTitle.trim(),
        description: newDescription.trim(),
      });
      setNewTitle('');
      setNewDescription('');
      setShowAddForm(false);
      await loadSubtasks();
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    } catch {
      // silently fail
    } finally {
      setAdding(false);
    }
  }

  async function handleStatusChange(subtaskId: string, newStatus: SubTaskStatus) {
    // Optimistic update
    setSubtasks((prev) =>
      prev.map((st) => (st.id === subtaskId ? { ...st, status: newStatus } : st))
    );
    try {
      await updateSubtask(task.id, subtaskId, { status: newStatus });
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    } catch {
      await loadSubtasks();
    }
  }

  async function handleDeleteSubtask(subtaskId: string) {
    setSubtasks((prev) => prev.filter((st) => st.id !== subtaskId));
    try {
      await deleteSubtask(task.id, subtaskId);
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    } catch {
      await loadSubtasks();
    }
  }

  function startEditing(st: SubTask) {
    setEditingId(st.id);
    setEditTitle(st.title);
    setEditDescription(st.description);
  }

  async function handleEditSave(subtaskId: string) {
    if (!editTitle.trim()) return;
    setSubtasks((prev) =>
      prev.map((st) =>
        st.id === subtaskId ? { ...st, title: editTitle.trim(), description: editDescription.trim() } : st
      )
    );
    setEditingId(null);
    try {
      await updateSubtask(task.id, subtaskId, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      });
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    } catch {
      await loadSubtasks();
    }
  }

  const doneCount = subtasks.filter((st) => st.status === 'Done').length;

  return (
    <div className="task-detail">
      <Link to={`/projects/${projectId}`} className="task-detail__back">
        <span className="task-detail__back-arrow">&#8592;</span>
        Back to tasks
      </Link>

      <h3 className="task-detail__title">{task.title}</h3>
      <p className="task-detail__description">{task.description}</p>

      <div className="task-detail__meta">
        <div className="task-detail__meta-item">
          <span className="task-detail__meta-label">Status</span>
          <span className="task-detail__meta-value">
            <span className={`status-badge status-badge--${task.status}`}>
              {task.status}
            </span>
          </span>
        </div>

        {task.priority && (
          <div className="task-detail__meta-item">
            <span className="task-detail__meta-label">Priority</span>
            <span className="task-detail__meta-value">
              <span className={`priority-badge priority-badge--${task.priority}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </span>
          </div>
        )}

        {member !== undefined && (
          <div className="task-detail__meta-item">
            <span className="task-detail__meta-label">Assignee</span>
            <span className="task-detail__meta-value">{member.name}</span>
          </div>
        )}

        {task.dueDate !== undefined && (
          <div className="task-detail__meta-item">
            <span className="task-detail__meta-label">Due Date</span>
            <span className="task-detail__meta-value">{task.dueDate}</span>
          </div>
        )}

        {task.completedAt !== undefined && (
          <div className="task-detail__meta-item">
            <span className="task-detail__meta-label">Completed</span>
            <span className="task-detail__meta-value">
              {new Date(task.completedAt).toLocaleDateString()}
            </span>
          </div>
        )}

        <div className="task-detail__meta-item">
          <span className="task-detail__meta-label">Created</span>
          <span className="task-detail__meta-value">
            {new Date(task.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Subtasks Section */}
      <div className="subtask-section">
        <div className="subtask-section__header">
          <h4 className="subtask-section__title">
            Subtasks
            {subtasks.length > 0 && (
              <span className="subtask-section__count">
                {' '}({doneCount}/{subtasks.length} done)
              </span>
            )}
          </h4>
          {canEdit && !showAddForm && (
            <button
              type="button"
              className="subtask-section__add-btn"
              onClick={() => setShowAddForm(true)}
            >
              + Add subtask
            </button>
          )}
        </div>

        {/* Progress bar */}
        {subtasks.length > 0 && (
          <div className="subtask-section__progress">
            <div
              className="subtask-section__progress-bar"
              style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
            />
          </div>
        )}

        {/* Add subtask form */}
        {showAddForm && canEdit && (
          <form className="subtask-add-form" onSubmit={handleAddSubtask}>
            <input
              type="text"
              className="subtask-add-form__input"
              placeholder="Subtask title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              disabled={adding}
            />
            <textarea
              className="subtask-add-form__textarea"
              placeholder="Description (optional)"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              disabled={adding}
            />
            <div className="subtask-add-form__actions">
              <button type="submit" className="subtask-add-form__submit" disabled={adding || !newTitle.trim()}>
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                className="subtask-add-form__cancel"
                onClick={() => { setShowAddForm(false); setNewTitle(''); setNewDescription(''); }}
                disabled={adding}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Subtask list */}
        {loading && subtasks.length === 0 ? (
          <p className="subtask-section__loading">Loading subtasks...</p>
        ) : subtasks.length === 0 && !showAddForm ? (
          <p className="subtask-section__empty">No subtasks yet.</p>
        ) : (
          <ul className="subtask-list">
            {subtasks.map((st, index) => (
              <li key={st.id} className="subtask-item">
                {editingId === st.id ? (
                  <div className="subtask-item__edit">
                    <input
                      type="text"
                      className="subtask-item__edit-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    />
                    <textarea
                      className="subtask-item__edit-textarea"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      placeholder="Description (optional)"
                    />
                    <div className="subtask-item__edit-actions">
                      <button
                        type="button"
                        className="subtask-add-form__submit"
                        onClick={() => handleEditSave(st.id)}
                        disabled={!editTitle.trim()}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="subtask-add-form__cancel"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="subtask-item__top">
                      <span className="subtask-item__number">{index + 1}.</span>
                      <span className="subtask-item__title">{st.title}</span>
                      <select
                        className={`subtask-item__status status-badge status-badge--${st.status}`}
                        value={st.status}
                        onChange={(e) => handleStatusChange(st.id, e.target.value as SubTaskStatus)}
                        disabled={!canEdit}
                      >
                        {SUBTASK_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {canEdit && (
                        <div className="subtask-item__actions">
                          <button
                            type="button"
                            className="subtask-item__edit-btn"
                            onClick={() => startEditing(st)}
                            title="Edit subtask"
                          >
                            &#9881;
                          </button>
                          <button
                            type="button"
                            className="subtask-item__delete-btn"
                            onClick={() => handleDeleteSubtask(st.id)}
                            title="Delete subtask"
                          >
                            &#10005;
                          </button>
                        </div>
                      )}
                    </div>
                    {st.description && (
                      <p className="subtask-item__description">{st.description}</p>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default TaskDetail
