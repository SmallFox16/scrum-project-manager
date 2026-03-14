import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { AddProjectForm } from '../components/AddProjectForm'
import { PageLayout } from '../components/PageLayout'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useCreateProject } from '../hooks/mutations/useCreateProject'
import type { ProjectFormData } from '../types'

export function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();

  useDocumentTitle('New Project | Scrum Project Manager');

  function handleAddProject(data: ProjectFormData) {
    createProject.mutate(
      { name: data.name, description: data.description, status: data.status },
      { onSuccess: () => void navigate('/projects') },
    );
  }

  const backLink = (
    <Link to="/projects" className="btn-secondary">
      Back to Projects
    </Link>
  );

  return (
    <PageLayout title="New Project" actions={backLink}>
      <p className="page-description">
        Fill in the details below to create a new project.
      </p>

      <div className="new-project-form-container">
        <AddProjectForm
          onAddProject={handleAddProject}
          onCancel={() => void navigate('/projects')}
        />
      </div>
    </PageLayout>
  )
}

export default NewProjectPage
