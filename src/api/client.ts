import { getToken, clearToken } from './auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

/**
 * Authenticated fetch wrapper.
 * - Prepends API_BASE to the path
 * - Attaches Authorization header if a token exists
 * - Handles 401 responses by clearing the token (forcing re-login)
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = getToken()

  const headers = new Headers(options.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event('auth:logout'))
  }

  return res
}
