import { http, HttpResponse, delay } from 'msw'
import { projects as initialProjects, tasks as initialTasks, teamMembers } from './data'
import type { Project } from '../types'
import type { Task } from '../types'

// Mutable copies — mutations will update these
let projects = [...initialProjects]
let tasks = [...initialTasks]

function randomDelay() {
  return delay(200 + Math.random() * 300)
}

// ============================================================
// Helpers: convert frontend camelCase to backend snake_case
// ============================================================

function toBackendProject(p: Project) {
  return {
    id: Number(p.id.replace('proj-', '')) || Date.now(),
    name: p.name,
    description: p.description || null,
    created_at: p.createdAt,
  }
}

function toBackendTask(t: Task) {
  const STATUS_MAP: Record<string, string> = {
    Todo: 'todo',
    InProgress: 'in_progress',
    InReview: 'in_review',
    Done: 'done',
  }
  return {
    id: Number(t.id.replace('task-', '')) || Date.now(),
    title: t.title,
    description: t.description || null,
    status: STATUS_MAP[t.status] ?? 'todo',
    assigned_to: t.assigneeId ? Number(t.assigneeId.replace('tm-', '')) || null : null,
    project_id: Number(t.projectId.replace('proj-', '')) || null,
    created_at: t.createdAt,
  }
}

export const handlers = [
  // ============================================================
  // Auth endpoints
  // ============================================================

  // POST /api/auth/login — Mock login
  http.post('/api/auth/login', async ({ request }) => {
    await randomDelay()
    const body = (await request.json()) as { email?: string; password?: string }
    if (!body.email || !body.password) {
      return HttpResponse.json({ error: 'Email and password required' }, { status: 400 })
    }
    // Accept any credentials in mock mode
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: { id: 1, name: 'Admin', email: body.email, role: 'admin' },
    })
  }),

  // GET /api/auth/me — Mock current user
  http.get('/api/auth/me', async () => {
    await randomDelay()
    return HttpResponse.json({
      user: { id: 1, name: 'Admin', email: 'admin@scrum.com', role: 'admin' },
    })
  }),

  // ============================================================
  // Users endpoint
  // ============================================================

  // GET /api/users — List team members (backend format)
  http.get('/api/users', async () => {
    await randomDelay()
    return HttpResponse.json({
      users: teamMembers.map((m) => ({
        id: Number(m.id.replace('tm-', '')) || 0,
        name: m.name,
        email: m.email,
        role: m.role,
      })),
    })
  }),

  // ============================================================
  // Project endpoints (backend-formatted responses)
  // ============================================================

  // GET /api/projects — List all projects (wrapped)
  http.get('/api/projects', async () => {
    await randomDelay()
    return HttpResponse.json({
      projects: projects.map((p) => toBackendProject(p)),
    })
  }),

  // GET /api/projects/:id — Get single project (wrapped, no embedded tasks)
  http.get('/api/projects/:id', async ({ params }) => {
    await randomDelay()
    const project = projects.find((p) => p.id === params.id)
    if (!project) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json({ project: toBackendProject(project) })
  }),

  // POST /api/projects — Create project
  http.post('/api/projects', async ({ request }) => {
    await randomDelay()
    const body = (await request.json()) as Partial<Project>
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: body.name ?? 'Untitled Project',
      description: body.description ?? '',
      status: body.status ?? 'active',
      taskCount: 0,
      dueDate: body.dueDate,
      createdBy: body.createdBy ?? 'tm-1',
      createdAt: new Date().toISOString(),
    }
    projects = [...projects, newProject]
    return HttpResponse.json({ project: toBackendProject(newProject) }, { status: 201 })
  }),

  // PATCH /api/projects/:id — Update project
  http.patch('/api/projects/:id', async ({ params, request }) => {
    await randomDelay()
    const body = (await request.json()) as Partial<Project>
    const index = projects.findIndex((p) => p.id === params.id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    projects = projects.map((p) =>
      p.id === params.id ? { ...p, ...body } : p
    )
    return HttpResponse.json({ project: toBackendProject(projects[index]) })
  }),

  // DELETE /api/projects/:id — Delete project
  http.delete('/api/projects/:id', async ({ params }) => {
    await randomDelay()
    const index = projects.findIndex((p) => p.id === params.id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }
    projects = projects.filter((p) => p.id !== params.id)
    tasks = tasks.filter((t) => t.projectId !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  // ============================================================
  // Task endpoints (backend-formatted responses)
  // ============================================================

  // GET /api/tasks?project_id=:id — List tasks for a project (wrapped)
  http.get('/api/tasks', async ({ request }) => {
    await randomDelay()
    const url = new URL(request.url)
    const projectId = url.searchParams.get('project_id')
    const filtered = projectId
      ? tasks.filter((t) => t.projectId === projectId || t.projectId === `proj-${projectId}`)
      : tasks
    return HttpResponse.json({
      tasks: filtered.map((t) => toBackendTask(t)),
    })
  }),

  // POST /api/tasks — Create task (backend route, not /api/projects/:id/tasks)
  http.post('/api/tasks', async ({ request }) => {
    await randomDelay()
    const body = (await request.json()) as Record<string, any>
    const projectId = body.project_id ? `proj-${body.project_id}` : ''
    const REVERSE_STATUS: Record<string, Task['status']> = {
      todo: 'Todo',
      in_progress: 'InProgress',
      in_review: 'InReview',
      done: 'Done',
    }
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: body.title ?? 'Untitled Task',
      description: body.description ?? '',
      status: REVERSE_STATUS[body.status] ?? body.status ?? 'Todo',
      assigneeId: body.assigned_to ? `tm-${body.assigned_to}` : undefined,
      assignees: [],
      projectId: projectId || (tasks.length > 0 ? tasks[0].projectId : ''),
      subtaskCount: 0,
      subtasks: [],
      createdAt: new Date().toISOString(),
    }
    tasks = [...tasks, newTask]
    projects = projects.map((p) =>
      p.id === newTask.projectId ? { ...p, taskCount: p.taskCount + 1 } : p
    )
    return HttpResponse.json({ task: toBackendTask(newTask) }, { status: 201 })
  }),

  // PUT /api/tasks/:id — Update task (backend uses PUT, not PATCH)
  http.put('/api/tasks/:id', async ({ params, request }) => {
    await randomDelay()
    const body = (await request.json()) as Record<string, any>
    const index = tasks.findIndex((t) => t.id === params.id)
    if (index === -1) {
      return new HttpResponse(null, { status: 404 })
    }

    const REVERSE_STATUS: Record<string, Task['status']> = {
      todo: 'Todo',
      in_progress: 'InProgress',
      in_review: 'InReview',
      done: 'Done',
    }

    // Map snake_case body back to camelCase for internal storage
    const updates: Partial<Task> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.status !== undefined) updates.status = REVERSE_STATUS[body.status] ?? body.status
    if (body.assigned_to !== undefined) updates.assigneeId = body.assigned_to ? `tm-${body.assigned_to}` : undefined

    tasks = tasks.map((t) =>
      t.id === params.id ? { ...t, ...updates } : t
    )
    const updated = tasks.find((t) => t.id === params.id)!
    return HttpResponse.json({ task: toBackendTask(updated) })
  }),

  // DELETE /api/tasks/:id — Delete task
  http.delete('/api/tasks/:id', async ({ params }) => {
    await randomDelay()
    const task = tasks.find((t) => t.id === params.id)
    if (!task) {
      return new HttpResponse(null, { status: 404 })
    }
    tasks = tasks.filter((t) => t.id !== params.id)
    projects = projects.map((p) =>
      p.id === task.projectId ? { ...p, taskCount: Math.max(0, p.taskCount - 1) } : p
    )
    return HttpResponse.json({ message: 'Task deleted' })
  }),

  // ============================================================
  // Legacy endpoints (kept for backward compatibility with old tests)
  // ============================================================

  // GET /api/team — Legacy team endpoint
  http.get('/api/team', async () => {
    await randomDelay()
    return HttpResponse.json(teamMembers)
  }),
]
