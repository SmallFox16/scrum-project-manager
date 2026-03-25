export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

export type UserRole = 'admin' | 'member';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: string;
  gender?: string;
}

export type ProjectStatus = 'active' | 'completed' | 'archived';

export interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  taskCount: number;
  dueDate?: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  status: ProjectStatus;
  dueDate: string;
}

export interface FormErrors {
  name?: string;
  description?: string;
}

export type TaskStatus = 'ToBeRefined' | 'Todo' | 'InProgress' | 'InReview' | 'Done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId?: string;
  projectId: string;
  dueDate?: string;
  timeEstimate?: string;
  sprintProjectId?: string;
  sprintProjectName?: string;
  createdAt: string;
  completedAt?: string;
}

// Project as returned by the API
export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  taskCount: number;
  dueDate?: string;
  createdBy: string;
  createdAt: string;
}
