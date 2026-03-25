import type { UserRole } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'auth_token'

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  gender?: string;
  avatar?: string | null;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface MeResponse {
  user: AuthUser;
}

// --- Token helpers ---

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// --- API calls ---

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || body.message || `Login failed: ${res.status}`)
  }
  return res.json()
}

export async function fetchMe(): Promise<AuthUser> {
  const token = getToken()
  if (!token) throw new Error('No token')
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Token invalid or expired')
  const data: MeResponse = await res.json()
  return data.user
}
