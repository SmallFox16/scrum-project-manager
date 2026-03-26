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
  status: string;
  created_at: string;
}

interface BackendAssignee {
  id: number;
  name: string;
  avatar?: string | null;
}

interface BackendTask {
  id: number;
  title: string;
  description: string | null;
  status: string;
  assigned_to: number | null;
  assignees?: BackendAssignee[];
  project_id: number | null;
  sprint_project_id: number | null;
  sprint_project_name: string | null;
  priority: number;
  time_estimate: string | null;
  due_date: string | null;
  created_at: string;
}

// ============================================================
// Transformers: backend → frontend
// ============================================================

const STATUS_MAP: Record<string, Task['status']> = {
  to_be_refined: 'ToBeRefined',
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
    status: (bp.status as Project['status']) || 'active',
    taskCount,
    createdBy: '',
    createdAt: bp.created_at,
  }
}

export function toFrontendTask(bt: BackendTask): Task {
  const assignees = (bt.assignees ?? []).map((a) => ({
    id: String(a.id),
    name: a.name,
    avatar: a.avatar,
  }));
  return {
    id: String(bt.id),
    title: bt.title,
    description: bt.description ?? '',
    status: STATUS_MAP[bt.status] ?? 'Todo',
    assigneeId: bt.assigned_to ? String(bt.assigned_to) : undefined,
    assignees,
    projectId: bt.project_id ? String(bt.project_id) : '',
    sprintProjectId: bt.sprint_project_id ? String(bt.sprint_project_id) : undefined,
    sprintProjectName: bt.sprint_project_name ?? undefined,
    timeEstimate: bt.time_estimate ?? undefined,
    dueDate: bt.due_date ?? undefined,
    createdAt: bt.created_at,
  }
}

// ============================================================
// Avatar helpers
// ============================================================

function buildTeamAvatarUrl(name: string, gender?: string): string {
  const seed = encodeURIComponent(name)
  if (gender === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&top=straight01&facialHairProbability=0`
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&top=shortFlat&facialHair=beardMedium`
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
export async function createProject(data: { name: string; description: string; status?: string }): Promise<Project> {
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

// PUT /api/projects/:id — Update a project
export async function updateProject(id: string, data: { status?: string }): Promise<Project> {
  const res = await apiFetch(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    throw new Error(`Failed to update project: ${res.status}`)
  }
  const result = await parseJson<{ project: BackendProject }>(res)
  return toFrontendProject(result.project)
}

// DELETE /api/projects/:id — Delete a project
export async function deleteProject(id: string): Promise<void> {
  const res = await apiFetch(`/projects/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    throw new Error(`Failed to delete project: ${res.status}`)
  }
}

// GET /api/users — Returns all team members
export async function fetchTeam(): Promise<TeamMember[]> {
  const res = await apiFetch('/users')
  if (!res.ok) {
    throw new Error(`Failed to fetch team: ${res.status}`)
  }
  const data = await parseJson<{ users: Array<{ id: number; name: string; email: string; role: string; gender?: string; avatar?: string | null }> }>(res)
  return data.users.map((u) => ({
    id: String(u.id),
    name: u.name,
    email: u.email,
    avatarUrl: u.avatar || buildTeamAvatarUrl(u.name, u.gender),
    role: u.role,
    gender: u.gender,
  }))
}

// GET /api/tasks/backlog-items — Available PBIs for sprint linking
export async function fetchBacklogItems(): Promise<Task[]> {
  const res = await apiFetch('/tasks/backlog-items')
  if (!res.ok) {
    throw new Error(`Failed to fetch backlog items: ${res.status}`)
  }
  const data = await parseJson<{ tasks: BackendTask[] }>(res)
  return data.tasks.map(toFrontendTask)
}
