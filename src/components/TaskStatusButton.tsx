import { useState, useRef, useEffect } from 'react'
import type { Task, TaskStatus } from '../types'

interface TaskStatusButtonProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus, completedAt?: string) => void;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  ToBeRefined: 'To Be Refined',
  Todo:        'To Do',
  InProgress:  'In Progress',
  InReview:    'In Review',
  Done:        'Done',
}

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  ToBeRefined: ['Todo', 'InProgress', 'InReview', 'Done'],
  Todo:        ['ToBeRefined', 'InProgress', 'InReview', 'Done'],
  InProgress:  ['ToBeRefined', 'Todo', 'InReview', 'Done'],
  InReview:    ['ToBeRefined', 'Todo', 'InProgress', 'Done'],
  Done:        ['ToBeRefined', 'Todo', 'InProgress', 'InReview'],
}

export function TaskStatusButton({ task, onStatusChange }: TaskStatusButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const nextStatuses = VALID_TRANSITIONS[task.status];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  function handleSelect(newStatus: TaskStatus) {
    const completedAt = newStatus === 'Done' ? new Date().toISOString() : undefined;
    onStatusChange(task.id, newStatus, completedAt);
    setIsOpen(false);
  }

  return (
    <div className="task-status-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className="task-status-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Change status of ${task.title}, currently ${STATUS_LABELS[task.status]}`}
        title="Move to..."
      >
        <span className="task-status-button__arrow">&#8594;</span>
        Move to&hellip;
      </button>
      {isOpen && (
        <ul className="task-status-dropdown__menu" role="listbox">
          {nextStatuses.map((newStatus) => (
            <li key={newStatus} role="option" aria-selected={false}>
              <button
                type="button"
                className={`task-status-dropdown__item status-badge--${newStatus}`}
                onClick={() => handleSelect(newStatus)}
              >
                {STATUS_LABELS[newStatus]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default TaskStatusButton
