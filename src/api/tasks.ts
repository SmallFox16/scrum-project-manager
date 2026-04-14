import type { Task, SubTask } from '../types'
import { parseJson, toFrontendTask } from './projects'
import { apiFetch } from './client'

// ============================================================
// Subtask status mapping
// ============================================================

const REVERSE_SUBTASK_STATUS: Record<string, string> = {
  Todo: 'todo',
  InProgress: 'in_progress',
  InReview: 'in_review',
  Done: 'done',
}

const SUBTASK_STATUS_MAP: Record<string, SubTask['status']> = {
  todo: 'Todo',
  in_progress: 'InProgress',
  in_review: 'InReview',
  done: 'Done',
}

function toFrontendSubtask(bs: any): SubTask {
  return {
    id: String(bs.id),
    parentTaskId: String(bs.parent_task_id),
    title: bs.title,
    description: bs.description ?? '',
    status: SUBTASK_STATUS_MAP[bs.status] ?? 'Todo',
    sortOrder: bs.sort_order,
    createdAt: bs.created_at,
  }
}

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

// ============================================================
// Subtask API functions
// ============================================================

// GET /api/tasks/:taskId/subtasks
export async function fetchSubtasks(taskId: string): Promise<SubTask[]> {
  const res = await apiFetch(`/tasks/${taskId}/subtasks`)
  if (!res.ok) {
    throw new Error(`Failed to fetch subtasks: ${res.status}`)
  }
  const data = await parseJson<{ subtasks: any[] }>(res)
  return data.subtasks.map(toFrontendSubtask)
}

// POST /api/tasks/:taskId/subtasks
export async function createSubtask(
  taskId: string,
  data: { title: string; description?: string },
): Promise<SubTask> {
  const res = await apiFetch(`/tasks/${taskId}/subtasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error(`Failed to create subtask: ${res.status}`)
  }
  const result = await parseJson<{ subtask: any }>(res)
  return toFrontendSubtask(result.subtask)
}

// PUT /api/tasks/:taskId/subtasks/:subtaskId
export async function updateSubtask(
  taskId: string,
  subtaskId: string,
  data: { title?: string; description?: string; status?: string },
): Promise<SubTask> {
  const body: Record<string, unknown> = {}
  if (data.title !== undefined) body.title = data.title
  if (data.description !== undefined) body.description = data.description
  if (data.status !== undefined) body.status = REVERSE_SUBTASK_STATUS[data.status] ?? data.status
  const res = await apiFetch(`/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Failed to update subtask: ${res.status}`)
  }
  const result = await parseJson<{ subtask: any }>(res)
  return toFrontendSubtask(result.subtask)
}

// DELETE /api/tasks/:taskId/subtasks/:subtaskId
export async function deleteSubtask(taskId: string, subtaskId: string): Promise<void> {
  const res = await apiFetch(`/tasks/${taskId}/subtasks/${subtaskId}`, {
    method: 'DELETE',
  })
  if (!res.ok) {
    throw new Error(`Failed to delete subtask: ${res.status}`)
  }
}
