import type { Project, Task } from '../types'
import type { TeamMember } from '../mocks/data'

// ============================================================
// API base URL
//
// import.meta.env.VITE_API_URL is replaced at build time by Vite.
// In development it reads from .env.development; in production
// from .env.production.  The fallback keeps tests working even
// if the env var is somehow absent.
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api'

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
  const res = await fetch(`${API_BASE}/projects`)
  if (!res.ok) {
    throw new Error(`Failed to fetch projects: ${res.status}`)
  }
  return parseJson<Project[]>(res)
}

// GET /api/projects/:id — Returns a single project with its tasks embedded
export async function fetchProject(id: string): Promise<ProjectWithTasks> {
  const res = await fetch(`${API_BASE}/projects/${id}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch project: ${res.status}`)
  }
  return parseJson<ProjectWithTasks>(res)
}

// GET /api/team — Returns all team members
export async function fetchTeam(): Promise<TeamMember[]> {
  const res = await fetch(`${API_BASE}/team`)
  if (!res.ok) {
    throw new Error(`Failed to fetch team: ${res.status}`)
  }
  return parseJson<TeamMember[]>(res)
}
