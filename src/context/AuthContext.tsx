import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { loginApi, fetchMe, setToken, clearToken, getToken } from '../api/auth'
import type { AuthUser } from '../api/auth'
import type { UserRole } from '../types'

// ============================================================
// Types
// ============================================================

export interface User extends AuthUser {
  avatarUrl: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  role: UserRole | null;
}

// ============================================================
// Helpers
// ============================================================

function buildAvatarUrl(name: string, gender?: string): string {
  const seed = encodeURIComponent(name)
  if (gender === 'female') {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&top=longHairStraight&facialHair=blank`
  }
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&top=shortHairShortFlat&facialHair=beardMedium`
}

function toUser(authUser: AuthUser): User {
  return {
    ...authUser,
    avatarUrl: buildAvatarUrl(authUser.name, authUser.gender),
  }
}

const MOCK_USER: User = {
  id: 1,
  name: 'Admin',
  email: 'admin@scrum.com',
  role: 'admin',
  avatarUrl: buildAvatarUrl('Admin', 'male'),
}

// ============================================================
// Context
// ============================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================================
// Provider
// ============================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Auto-login on mount
  useEffect(() => {
    // In mock mode, auto-login with a fake user
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
      setUser(MOCK_USER)
      setIsLoading(false)
      return
    }

    // In real mode, check for existing token
    const token = getToken()
    if (!token) {
      setIsLoading(false)
      return
    }
    fetchMe()
      .then((authUser) => setUser(toUser(authUser)))
      .catch(() => clearToken())
      .finally(() => setIsLoading(false))
  }, [])

  // Listen for forced logout (e.g. 401 from apiFetch)
  useEffect(() => {
    function handleForceLogout() {
      setUser(null)
    }
    window.addEventListener('auth:logout', handleForceLogout)
    return () => window.removeEventListener('auth:logout', handleForceLogout)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: authUser } = await loginApi(email, password)
    setToken(token)
    setUser(toUser(authUser))
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      logout,
      role: user?.role ?? null,
    }),
    [user, isLoading, login, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================
// Custom hook
// ============================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
