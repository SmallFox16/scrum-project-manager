import type { Project, Task, TeamMember } from '../types'
import { apiFetch } from './client'

// ============================================================
// API base URL
//
// import.meta.env.VITE_API_URL is replaced at build time by Vite.
// In development it reads from .env.development; in production
// from .env.production.  The fallback keeps tests working even
// if the env var is somehow absent.
// ============================================================

/** Parse response as JSON or throw a clear error if body is not JSON (e.g. HTML). */
export async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  if (!text || text.trim().length === 0) {
    throw new Error('Empty response from server')
  }
  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(
      `Server returned invalid data (not JSON). ${res.ok ? '' : `Status: ${res.status}. `}Try refreshing the page.`
    )
  }
}

// ============================================================
// Backend response types (snake_case)
// ============================================================

interface BackendProject {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

interface BackendTask {
  id: number;
  title: string;
  description: string | null;
  status: string;
  assigned_to: number | null;
  project_id: number | null;
  created_at: string;
}

// ============================================================
// Transformers: backend → frontend
// ============================================================

const STATUS_MAP: Record<string, Task['status']> = {
  todo: 'Todo',
  in_progress: 'InProgress',
  in_review: 'InReview',
  done: 'Done',
}

function toFrontendProject(bp: BackendProject, taskCount = 0): Project {
  return {
    id: String(bp.id),
    name: bp.name,
    description: bp.description ?? '',
    status: 'active',
    taskCount,
    createdBy: '',
    createdAt: bp.created_at,
  }
}

export function toFrontendTask(bt: BackendTask): Task {
  return {
    id: String(bt.id),
    title: bt.title,
    description: bt.description ?? '',
    status: STATUS_MAP[bt.status] ?? 'Todo',
    assigneeId: bt.assigned_to ? String(bt.assigned_to) : undefined,
    projectId: bt.project_id ? String(bt.project_id) : '',
    createdAt: bt.created_at,
  }
}

// ============================================================
// Typed fetch functions
//
// These are plain async functions — not hooks.  They are used as
// the `queryFn` argument to useQuery().  Keeping fetch logic
// separate from the hooks makes them:
//   - Easy to test in isolation
//   - Reusable across prefetchQuery, getQueryData, etc.
//   - Readable: hooks declare *how to cache*, functions declare *how to fetch*
// ============================================================

export type ProjectWithTasks = Project & { tasks: Task[] }

// GET /api/projects — Returns all projects
export async function fetchProjects(): Promise<Project[]> {
  const res = await apiFetch('/projects')
  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${res.status}`)
  }
  const data = await parseJson<{ projects: BackendProject[] }>(res)
  return data.projects.map((p) => toFrontendProject(p))
}

// GET /api/projects/:id + GET /api/tasks?project_id=:id
// Returns a single project with its tasks merged
export async function fetchProject(id: string): Promise<ProjectWithTasks> {
  const [projectRes, tasksRes] = await Promise.all([
    apiFetch(`/projects/${id}`),
    apiFetch(`/tasks?project_id=${id}`),
  ])

  if (!projectRes.ok) {
    throw new Error(`Failed to fetch project: ${projectRes.status}`)
  }
  if (!tasksRes.ok) {
    throw new Error(`Failed to fetch tasks: ${tasksRes.status}`)
  }

  const projectData = await parseJson<{ project: BackendProject }>(projectRes)
  const tasksData = await parseJson<{ tasks: BackendTask[] }>(tasksRes)

  const tasks = tasksData.tasks.map(toFrontendTask)

  return {
    ...toFrontendProject(projectData.project, tasks.length),
    tasks,
  }
}

// POST /api/projects — Create a new project
export async function createProject(data: { name: string; description: string }): Promise<Project> {
  const res = await apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error(`Failed to create project: ${res.status}`)
  }
  const result = await parseJson<{ project: BackendProject }>(res)
  return toFrontendProject(result.project)
}

// GET /api/users — Returns all team members
export async function fetchTeam(): Promise<TeamMember[]> {
  const res = await apiFetch('/users')
  if (!res.ok) {
    throw new Error(`Failed to fetch team: ${res.status}`)
  }
  const data = await parseJson<{ users: Array<{ id: number; name: string; email: string; role: string }> }>(res)
  return data.users.map((u) => ({
    id: String(u.id),
    name: u.name,
    email: u.email,
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
    role: u.role,
  }))
}
