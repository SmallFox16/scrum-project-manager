import { useState, useEffect } from 'react'
import type React from 'react'
import { useCreateTask } from '../hooks/mutations/useCreateTask'
import { fetchBacklogItems } from '../api/projects'
import { linkPbiToSprint } from '../api/tasks'
import { useQueryClient } from '@tanstack/react-query'
import type { Task } from '../types'

interface AddTaskFormProps {
  projectId: string;
  isProductBacklog?: boolean;
}

interface FieldState {
  title: string;
  description: string;
  timeOrDate: 'none' | 'time' | 'date';
  timeEstimate: string;
  dueDate: string;
}

const EMPTY_FIELDS: FieldState = {
  title: '',
  description: '',
  timeOrDate: 'none',
  timeEstimate: '',
  dueDate: '',
};

export function AddTaskForm({ projectId, isProductBacklog = false }: AddTaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fields, setFields] = useState<FieldState>(EMPTY_FIELDS);
  const [titleError, setTitleError] = useState<string | undefined>(undefined);

  // PBI linking state (for sprint projects only)
  const [mode, setMode] = useState<'select-pbi' | 'custom'>('select-pbi');
  const [backlogItems, setBacklogItems] = useState<Task[]>([]);
  const [loadingPbis, setLoadingPbis] = useState(false);
  const [linkingPbi, setLinkingPbi] = useState(false);

  const createTask = useCreateTask(projectId);
  const queryClient = useQueryClient();

  const isSprintProject = !isProductBacklog;

  useEffect(() => {
    if (isOpen && isSprintProject) {
      setLoadingPbis(true);
      fetchBacklogItems()
        .then(setBacklogItems)
        .catch(() => setBacklogItems([]))
        .finally(() => setLoadingPbis(false));
    }
  }, [isOpen, isSprintProject]);

  async function handleLinkPbi(taskId: string) {
    setLinkingPbi(true);
    try {
      await linkPbiToSprint(taskId, projectId);
      await queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      setIsOpen(false);
      setMode('select-pbi');
    } catch {
      // silently fail — user can retry
    } finally {
      setLinkingPbi(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (fields.title.trim().length < 2) {
      setTitleError('Title must be at least 2 characters');
      return;
    }

    const taskData: Partial<Task> = {
      title: fields.title.trim(),
      description: fields.description.trim(),
      status: isProductBacklog ? 'ToBeRefined' : 'Todo',
    };

    if (fields.timeOrDate === 'time' && fields.timeEstimate.trim()) {
      taskData.timeEstimate = fields.timeEstimate.trim();
    } else if (fields.timeOrDate === 'date' && fields.dueDate) {
      taskData.dueDate = fields.dueDate;
    }

    createTask.mutate(taskData, {
      onSuccess: () => {
        setFields(EMPTY_FIELDS);
        setTitleError(undefined);
        setIsOpen(false);
        setMode('select-pbi');
      },
    });
  }

  function handleCancel() {
    setFields(EMPTY_FIELDS);
    setTitleError(undefined);
    setIsOpen(false);
    setMode('select-pbi');
  }

  if (!isOpen) {
    return (
      <div className="add-task-form">
        <button
          type="button"
          className="add-task-form__toggle"
          onClick={() => setIsOpen(true)}
        >
          + Add task
        </button>
      </div>
    );
  }

  // Sprint project: show PBI picker first
  if (isSprintProject && mode === 'select-pbi') {
    return (
      <div className="add-task-form">
        <div className="add-task-form__pbi-picker">
          <h4 className="add-task-form__pbi-heading">Pull from Product Backlog</h4>
          {loadingPbis ? (
            <p className="add-task-form__pbi-loading">Loading backlog items...</p>
          ) : backlogItems.length === 0 ? (
            <p className="add-task-form__pbi-empty">No available PBIs in Product Backlog.</p>
          ) : (
            <ul className="add-task-form__pbi-list">
              {backlogItems.map((pbi) => (
                <li key={pbi.id}>
                  <button
                    type="button"
                    className="add-task-form__pbi-item"
                    onClick={() => handleLinkPbi(pbi.id)}
                    disabled={linkingPbi}
                  >
                    <span className="add-task-form__pbi-title">{pbi.title}</span>
                    <span className={`status-badge status-badge--${pbi.status}`}>{pbi.status}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="add-task-form__pbi-actions">
            <button
              type="button"
              className="add-task-form__pbi-custom"
              onClick={() => setMode('custom')}
            >
              + Create new custom task
            </button>
            <button
              type="button"
              className="add-task-form__cancel"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-task-form">
      <form onSubmit={handleSubmit} noValidate>
        <div className="add-task-form__fields">
          <div className="add-task-form__row">
            <input
              type="text"
              className="add-task-form__input"
              placeholder="Task title"
              value={fields.title}
              onChange={(e) => {
                setFields({ ...fields, title: e.target.value });
                if (titleError !== undefined) setTitleError(undefined);
              }}
              aria-label="Task title"
              aria-describedby={titleError !== undefined ? 'add-task-title-error' : undefined}
              aria-invalid={titleError !== undefined}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              disabled={createTask.isPending}
            />
            <button
              type="submit"
              className="add-task-form__submit"
              disabled={createTask.isPending}
            >
              {createTask.isPending ? 'Adding\u2026' : 'Add'}
            </button>
            <button
              type="button"
              className="add-task-form__cancel"
              onClick={handleCancel}
              disabled={createTask.isPending}
            >
              Cancel
            </button>
          </div>

          {titleError !== undefined && (
            <p id="add-task-title-error" className="add-task-form__error" role="alert">
              {titleError}
            </p>
          )}

          {createTask.isError && (
            <p className="add-task-form__error" role="alert">
              Failed to add task. Please try again.
            </p>
          )}

          <textarea
            className="add-task-form__textarea"
            placeholder="Description (optional)"
            value={fields.description}
            onChange={(e) => setFields({ ...fields, description: e.target.value })}
            aria-label="Task description"
            rows={2}
            disabled={createTask.isPending}
          />

          {/* Time Estimate OR Due Date toggle */}
          <div className="add-task-form__time-date-toggle">
            <label className="add-task-form__radio-label">
              <input
                type="radio"
                name="timeOrDate"
                value="none"
                checked={fields.timeOrDate === 'none'}
                onChange={() => setFields({ ...fields, timeOrDate: 'none', timeEstimate: '', dueDate: '' })}
              />
              None
            </label>
            <label className="add-task-form__radio-label">
              <input
                type="radio"
                name="timeOrDate"
                value="time"
                checked={fields.timeOrDate === 'time'}
                onChange={() => setFields({ ...fields, timeOrDate: 'time', dueDate: '' })}
              />
              Time Estimate
            </label>
            <label className="add-task-form__radio-label">
              <input
                type="radio"
                name="timeOrDate"
                value="date"
                checked={fields.timeOrDate === 'date'}
                onChange={() => setFields({ ...fields, timeOrDate: 'date', timeEstimate: '' })}
              />
              Due Date
            </label>
          </div>

          {fields.timeOrDate === 'time' && (
            <input
              type="text"
              className="add-task-form__input"
              placeholder="e.g. 3 hours, 2 days"
              value={fields.timeEstimate}
              onChange={(e) => setFields({ ...fields, timeEstimate: e.target.value })}
              aria-label="Time estimate"
              disabled={createTask.isPending}
            />
          )}

          {fields.timeOrDate === 'date' && (
            <input
              type="date"
              className="add-task-form__input"
              value={fields.dueDate}
              onChange={(e) => setFields({ ...fields, dueDate: e.target.value })}
              aria-label="Due date"
              disabled={createTask.isPending}
            />
          )}
        </div>
      </form>
    </div>
  )
}

export default AddTaskForm
