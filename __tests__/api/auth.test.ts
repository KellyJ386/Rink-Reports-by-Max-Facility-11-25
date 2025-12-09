/**
 * API tests for authentication endpoints
 * @file __tests__/api/auth.test.ts
 */

import { POST as loginHandler } from '@/app/api/auth/login/route'
import { POST as logoutHandler } from '@/app/api/auth/logout/route'
import { GET as meHandler } from '@/app/api/auth/me/route'
import { NextRequest } from 'next/server'

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}))

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { hashPassword, generateToken } from '@/lib/auth'

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      passwordHash: '',
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      facilityId: 'facility-1',
      roleId: 'role-1',
      role: {
        id: 'role-1',
        name: 'Staff',
        permissions: {
          ice_depth: { view: true, create: true, edit: false, delete: false, export: false },
        },
      },
      facility: {
        id: 'facility-1',
        name: 'Test Facility',
      },
    }

    beforeAll(async () => {
      mockUser.passwordHash = await hashPassword('testPassword123')
    })

    it('should login successfully with valid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)
      ;(prisma.auditLog.create as jest.Mock).mockResolvedValue({})

      const mockCookies = {
        set: jest.fn(),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testPassword123',
        }),
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('test@example.com')
      expect(mockCookies.set).toHaveBeenCalled()
    })

    it('should return 401 for invalid email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password123',
        }),
      })

      const response = await loginHandler(request)

      expect(response.status).toBe(401)
    })

    it('should return 401 for inactive user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        isActive: false,
      })

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testPassword123',
        }),
      })

      const response = await loginHandler(request)

      expect(response.status).toBe(401)
    })

    it('should return 400 for missing credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await loginHandler(request)

      expect(response.status).toBe(400)
    })
  })

  describe('POST /api/auth/logout', () => {
    it('should clear auth cookie on logout', async () => {
      const mockCookies = {
        delete: jest.fn(),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
      })

      const response = await logoutHandler(request)

      expect(response.status).toBe(200)
      expect(mockCookies.delete).toHaveBeenCalledWith('auth-token')
    })
  })

  describe('GET /api/auth/me', () => {
    it('should return 401 when not authenticated', async () => {
      const mockCookies = {
        get: jest.fn().mockReturnValue(undefined),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookies)

      const request = new NextRequest('http://localhost:3000/api/auth/me')

      const response = await meHandler(request)

      expect(response.status).toBe(401)
    })

    it('should return user data when authenticated', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: {
          id: 'role-1',
          name: 'Staff',
          permissions: {},
        },
        facility: {
          id: 'facility-1',
          name: 'Test Facility',
        },
      }

      const token = generateToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'Staff',
      })

      const mockCookies = {
        get: jest.fn().mockReturnValue({ value: token }),
      }
      ;(cookies as jest.Mock).mockReturnValue(mockCookies)
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/me')

      const response = await meHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.email).toBe('test@example.com')
    })
  })
})
