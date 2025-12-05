import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'
import { middleware } from '@/middleware'
import * as auth from '@/lib/auth'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  verifyToken: vi.fn(),
}))

// Helper to create NextRequest with optional cookies
function createRequest(
  pathname: string,
  cookies?: Record<string, string>
): NextRequest {
  const url = `http://localhost${pathname}`
  const request = new NextRequest(url)

  if (cookies) {
    Object.entries(cookies).forEach(([name, value]) => {
      request.cookies.set(name, value)
    })
  }

  return request
}

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Public routes', () => {
    it('should allow access to /login without authentication', () => {
      const request = createRequest('/login')

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should allow access to /login with query params', () => {
      const request = createRequest('/login?redirect=/dashboard')

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should allow access to /api/auth/login without authentication', () => {
      const request = createRequest('/api/auth/login')

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })
  })

  describe('Protected routes - No token', () => {
    it('should redirect to /login when accessing /dashboard without token', () => {
      const request = createRequest('/dashboard')

      const response = middleware(request)

      expect(response.status).toBe(307) // Redirect status
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should redirect to /login when accessing /api/auth/me without token', () => {
      const request = createRequest('/api/auth/me')

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should redirect to /login when accessing nested dashboard routes without token', () => {
      const request = createRequest('/dashboard/ice-depth')

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })
  })

  describe('Protected routes - Invalid token', () => {
    it('should redirect to /login and clear cookie when token is invalid', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(null)
      const request = createRequest('/dashboard', { auth_token: 'invalid-token' })

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
      expect(auth.verifyToken).toHaveBeenCalledWith('invalid-token')

      // Check that cookie is deleted (uses Expires in the past or Max-Age=0)
      const setCookieHeader = response.headers.get('set-cookie')
      expect(setCookieHeader).toContain('auth_token=')
      // Cookie deletion can use either Max-Age=0 or Expires with past date
      const isDeleted = setCookieHeader?.includes('Max-Age=0') ||
                       setCookieHeader?.includes('Expires=Thu, 01 Jan 1970')
      expect(isDeleted).toBe(true)
    })

    it('should verify token with verifyToken function', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(null)
      const request = createRequest('/dashboard', { auth_token: 'some-token' })

      middleware(request)

      expect(auth.verifyToken).toHaveBeenCalledWith('some-token')
    })
  })

  describe('Protected routes - Valid token', () => {
    const validPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      facilityId: 'facility-123',
      roleId: 'role-123',
    }

    it('should allow access to /dashboard with valid token', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(validPayload)
      const request = createRequest('/dashboard', { auth_token: 'valid-token' })

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should allow access to /api/auth/me with valid token', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(validPayload)
      const request = createRequest('/api/auth/me', { auth_token: 'valid-token' })

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should allow access to nested dashboard routes with valid token', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(validPayload)
      const request = createRequest('/dashboard/ice-depth/submit', { auth_token: 'valid-token' })

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should allow access to /api/auth/logout with valid token', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(validPayload)
      const request = createRequest('/api/auth/logout', { auth_token: 'valid-token' })

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })
  })

  describe('API routes protection', () => {
    const validPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      facilityId: 'facility-123',
      roleId: 'role-123',
    }

    it('should protect arbitrary API routes', () => {
      const request = createRequest('/api/submissions')

      const response = middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should allow access to API routes with valid token', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(validPayload)
      const request = createRequest('/api/submissions', { auth_token: 'valid-token' })

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })
  })

  describe('Edge cases', () => {
    const validPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      facilityId: 'facility-123',
      roleId: 'role-123',
    }

    it('should handle root path /', () => {
      const request = createRequest('/')

      const response = middleware(request)

      // Root path is protected, should redirect
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should handle root path / with valid token', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(validPayload)
      const request = createRequest('/', { auth_token: 'valid-token' })

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should handle paths that start with /login but are not /login', () => {
      // /login-page should be treated as starting with /login
      const request = createRequest('/login-page')

      const response = middleware(request)

      // Since it starts with /login, it should be allowed
      expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('should handle multiple cookies', () => {
      vi.mocked(auth.verifyToken).mockReturnValue(validPayload)
      const url = 'http://localhost/dashboard'
      const request = new NextRequest(url)
      request.cookies.set('auth_token', 'valid-token')
      request.cookies.set('other_cookie', 'some-value')

      const response = middleware(request)

      expect(response.headers.get('x-middleware-next')).toBe('1')
      expect(auth.verifyToken).toHaveBeenCalledWith('valid-token')
    })
  })
})
