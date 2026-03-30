import type { Task } from '../types'
import { parseJson, toFrontendTask } from './projects'
import { apiFetch } from './client'

// ============================================================
// Mutation fetch functions
//
// These are plain async functions used as the `mutationFn`
// argument to useMutation().  They are separate from the query
// functions in api/projects.ts to keep concerns clear:
//   - projects.ts = read (GET)
//   - tasks.ts    = write (POST, PUT, DELETE)
// ============================================================

const REVERSE_STATUS_MAP: Record<string, string> = {
  ToBeRefined: 'to_be_refined',
  Todo: 'todo',
  InProgress: 'in_progress',
  InReview: 'in_review',
  Done: 'done',
}

function toBackendTaskData(data: Partial<Task>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  if (data.title !== undefined) result.title = data.title
  if (data.description !== undefined) result.description = data.description
  if (data.status !== undefined) result.status = REVERSE_STATUS_MAP[data.status] ?? data.status
  if (data.assigneeId !== undefined) result.assigned_to = data.assigneeId ? Number(data.assigneeId) : null
  if (data.assignees !== undefined) result.assignee_ids = data.assignees.map((a) => Number(a.id))
  if (data.projectId !== undefined) result.project_id = Number(data.projectId)
  if (data.sprintProjectId !== undefined) result.sprint_project_id = data.sprintProjectId ? Number(data.sprintProjectId) : null
  if (data.timeEstimate !== undefined) result.time_estimate = data.timeEstimate || null
  if (data.dueDate !== undefined) result.due_date = data.dueDate || null
  if (data.priority !== undefined) result.priority_level = data.priority || null
  return result
}

// POST /api/tasks — Create a new task
export async function createTask(
  projectId: string,
  data: Partial<Task>,
): Promise<Task> {
  const body = { ...toBackendTaskData(data), project_id: Number(projectId) }
  const res = await apiFetch('/tasks', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.status}`)
  }
  const result = await parseJson<{ task: any }>(res)
  return toFrontendTask(result.task)
}

// PUT /api/tasks/:taskId — Update task fields (status, assignee, etc.)
export async function updateTask(
  taskId: string,
  data: Partial<Task>,
): Promise<Task> {
  const res = await apiFetch(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(toBackendTaskData(data)),
  })
  if (!res.ok) {
    throw new Error(`Failed to update task: ${res.status}`)
  }
  const result = await parseJson<{ task: any }>(res)
  return toFrontendTask(result.task)
}

// DELETE /api/tasks/:taskId — Delete a task
export async function deleteTask(taskId: string): Promise<void> {
  const res = await apiFetch(`/tasks/${taskId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete task: ${res.status}`)
  }
}

// PUT /api/tasks/reorder — Reorder tasks by priority
export async function reorderTasks(taskIds: string[]): Promise<void> {
  const res = await apiFetch('/tasks/reorder', {
    method: 'PUT',
    body: JSON.stringify({ taskIds: taskIds.map(Number) }),
  })
  if (!res.ok) {
    throw new Error(`Failed to reorder tasks: ${res.status}`)
  }
}

// PUT /api/tasks/:taskId — Link a PBI to a sprint project
export async function linkPbiToSprint(taskId: string, sprintProjectId: string): Promise<Task> {
  const res = await apiFetch(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify({ sprint_project_id: Number(sprintProjectId) }),
  })
  if (!res.ok) {
    throw new Error(`Failed to link PBI to sprint: ${res.status}`)
  }
  const result = await parseJson<{ task: any }>(res)
  return toFrontendTask(result.task)
}
