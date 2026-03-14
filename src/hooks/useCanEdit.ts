import { useAuth } from '../context/AuthContext'

/**
 * Returns true if the current user has write permissions.
 * Admin role is read-only (observer); member role has full CRUD.
 */
export function useCanEdit(): boolean {
  const { role } = useAuth()
  return role === 'member'
}
