'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// User types that match the API response
interface User {
  id: string
  email: string
  name: string
  facilityId: string
  roleId: string
  role: {
    id: string
    name: string
    level: number
    permissions: string[]
  }
  facility?: {
    id: string
    name: string
    code: string
  }
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasMinRole: (level: number) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUser(data.data)
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.data.user)
        return { success: true }
      } else {
        return { success: false, error: data.error?.message || 'Login failed' }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/login')
      router.refresh()
    }
  }, [router])

  const hasPermission = useCallback(
    (permission: string) => {
      if (!user || !user.role) return false
      return user.role.permissions?.includes(permission) ?? false
    },
    [user]
  )

  const hasMinRole = useCallback(
    (level: number) => {
      if (!user || !user.role) return false
      return user.role.level >= level
    },
    [user]
  )

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasMinRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Role levels for easy comparison
export const RoleLevels = {
  OPERATOR: 1,
  SUPERVISOR: 2,
  MANAGER: 3,
  GM: 4,
  ADMIN: 5,
} as const

// Permission constants
export const Permissions = {
  // View permissions
  VIEW_DASHBOARD: 'view:dashboard',
  VIEW_REPORTS: 'view:reports',
  VIEW_ANALYTICS: 'view:analytics',
  VIEW_EQUIPMENT: 'view:equipment',
  VIEW_SCHEDULE: 'view:schedule',
  VIEW_INCIDENTS: 'view:incidents',
  VIEW_CHECKLISTS: 'view:checklists',
  VIEW_ADMIN: 'view:admin',

  // Edit permissions
  EDIT_REPORTS: 'edit:reports',
  EDIT_EQUIPMENT: 'edit:equipment',
  EDIT_SCHEDULE: 'edit:schedule',
  EDIT_INCIDENTS: 'edit:incidents',
  EDIT_CHECKLISTS: 'edit:checklists',

  // Admin permissions
  MANAGE_USERS: 'manage:users',
  MANAGE_FACILITY: 'manage:facility',
  MANAGE_ROLES: 'manage:roles',
  MANAGE_SETTINGS: 'manage:settings',
} as const
