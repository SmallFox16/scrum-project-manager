import { useEffect } from 'react'
import { useParams, Outlet, Link, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProject } from '../hooks/queries/useProject'
import { useDeleteProject } from '../hooks/mutations/useDeleteProject'
import { useUpdateProject } from '../hooks/mutations/useUpdateProject'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { ErrorMessage } from '../components/ErrorMessage'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useAppDispatch } from '../store/redux/hooks'
import { addRecentlyViewed } from '../store/redux/recentlyViewedSlice'
import type { Task, ProjectStatus } from '../types'
import type { ProjectWithTasks } from '../api/projects'

export type ProjectDetailOutletContext = {
  tasks: Task[];
};

export function ProjectDetailPanel() {
  const { projectId } = useParams<{ projectId: string }>();

  const { data: project, isPending, error, refetch } = useProject(projectId ?? '')

  const dispatch = useAppDispatch()

  useEffect(() => {
    if (projectId !== undefined && project !== undefined) {
      dispatch(addRecentlyViewed(projectId))
    }
  }, [projectId, project, dispatch])

  if (projectId === undefined) {
    return (
      <div className="project-detail-panel">
        <p>Invalid URL: missing project ID.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="project-detail-panel">
        <LoadingSpinner label="Loading project..." />
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="project-detail-panel">
        <ErrorMessage message={error.message} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (project === undefined) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ProjectDetailContent project={project} />
    </ErrorBoundary>
  );
}

interface ProjectDetailContentProps {
  project: ProjectWithTasks;
}

function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const navigate = useNavigate();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject(project.id);

  useDocumentTitle(`${project.name} | Scrum Project Manager`);

  function handleStatusChange(newStatus: ProjectStatus) {
    updateProject.mutate({ status: newStatus });
  }

  function handleDelete() {
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      deleteProject.mutate(project.id, {
        onSuccess: () => void navigate('/projects'),
      });
    }
  }

  const isOverdue =
    project.dueDate !== undefined && new Date(project.dueDate) < new Date();

  const outletContext: ProjectDetailOutletContext = { tasks: project.tasks };

  return (
    <div className="project-detail-panel">
      <Link to="/projects" className="project-detail-panel__back">
        &#8592; Back to projects
      </Link>
      <header className="project-detail-panel__header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="project-detail-panel__title">{project.name}</h2>
          <button
            className="btn-danger"
            onClick={handleDelete}
            disabled={deleteProject.isPending}
          >
            {deleteProject.isPending ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
        <p className="project-detail-panel__description">{project.description}</p>

        <div className="project-detail-panel__meta">
          <div className="project-detail-panel__meta-item">
            <span className="project-detail-panel__meta-label">Status</span>
            <span className="project-detail-panel__meta-value">
              <select
                className={`status-select status-badge status-badge--${project.status}`}
                value={project.status}
                onChange={(e) => handleStatusChange(e.target.value as ProjectStatus)}
                disabled={updateProject.isPending}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </span>
          </div>

          <div className="project-detail-panel__meta-item">
            <span className="project-detail-panel__meta-label">Tasks</span>
            <span className="project-detail-panel__meta-value">
              {project.taskCount}
            </span>
          </div>

          {project.dueDate !== undefined && (
            <div className="project-detail-panel__meta-item">
              <span className="project-detail-panel__meta-label">Due Date</span>
              <span className="project-detail-panel__meta-value">
                {project.dueDate}
                {isOverdue && (
                  <span className="project-detail-panel__overdue">
                    {' '}&#9888; Overdue
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </header>

      <Outlet context={outletContext} />
    </div>
  )
}

export default ProjectDetailPanel
