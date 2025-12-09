import { NextResponse } from 'next/server'
import { getSession, requireAuth } from './auth'
import { getUserPermissions } from './permissions'
import type { UserWithRole } from '@/types'

/**
 * Middleware helper to require authentication for API routes
 * @param handler - The actual route handler function
 * @returns Protected route handler
 */
export function withAuth<T>(
  handler: (user: UserWithRole) => Promise<NextResponse<T>>
) {
  return async () => {
    try {
      const user = await requireAuth()
      return handler(user)
    } catch (error) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
  }
}

/**
 * Middleware helper to require specific permissions for API routes
 * @param module - The module to check permissions for
 * @param action - The action to check (e.g., 'submit', 'viewAll', 'export')
 * @param handler - The actual route handler function
 * @returns Protected route handler
 */
export function withPermission<T>(
  module: string,
  action: string,
  handler: (user: UserWithRole) => Promise<NextResponse<T>>
) {
  return async () => {
    try {
      const user = await requireAuth()
      const permissions = getUserPermissions(user)

      // Check if user has the required permission
      const modulePermissions = permissions[module]
      if (!modulePermissions || !modulePermissions[action]) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      return handler(user)
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'An error occurred' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware helper to optionally get current user (doesn't require auth)
 * @param handler - The route handler function
 * @returns Route handler with optional user
 */
export function withOptionalAuth<T>(
  handler: (user: UserWithRole | null) => Promise<NextResponse<T>>
) {
  return async () => {
    try {
      const user = await getSession()
      return handler(user)
    } catch (error) {
      console.error('Optional auth error:', error)
      return handler(null)
    }
  }
}

/**
 * Check if user has admin access
 * @param user - User to check
 * @returns True if user has admin access
 */
export function isAdmin(user: UserWithRole): boolean {
  const permissions = getUserPermissions(user)
  return permissions.admin?.access === true
}

/**
 * Middleware helper to require admin access
 * @param handler - The route handler function
 * @returns Protected route handler for admins only
 */
export function withAdmin<T>(
  handler: (user: UserWithRole) => Promise<NextResponse<T>>
) {
  return async () => {
    try {
      const user = await requireAuth()

      if (!isAdmin(user)) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        )
      }

      return handler(user)
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      return NextResponse.json(
        { error: 'An error occurred' },
        { status: 500 }
      )
    }
  }
}
