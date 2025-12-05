/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { POST as loginHandler } from '@/app/api/auth/login/route'
import * as auth from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock auth module
jest.mock('@/lib/auth', () => ({
  authenticate: jest.fn(),
  generateToken: jest.fn(),
  setAuthCookie: jest.fn(),
}))

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}))

describe('Auth API Routes', () => {
  const mockAuth = auth as jest.Mocked<typeof auth>
  const mockPrisma = prisma as jest.Mocked<typeof prisma>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/login', () => {
    const createRequest = (body: unknown) =>
      new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
      })

    it('should return 400 if email is missing', async () => {
      const request = createRequest({ password: 'password123' })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('should return 400 if password is missing', async () => {
      const request = createRequest({ email: 'test@example.com' })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('should return 401 for invalid credentials', async () => {
      mockAuth.authenticate.mockResolvedValue(null)

      const request = createRequest({
        email: 'test@example.com',
        password: 'wrongpassword',
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid email or password')
    })

    it('should return user data on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        facilityId: 'facility-1',
        roleId: 'role-1',
        role: { name: 'Operator' },
        facility: { name: 'Main Arena' },
      }

      mockAuth.authenticate.mockResolvedValue(mockUser as any)
      mockAuth.generateToken.mockReturnValue('mock-token')
      mockAuth.setAuthCookie.mockResolvedValue(undefined)
      ;(mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({})

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Operator',
        facility: 'Main Arena',
      })
    })

    it('should generate token with correct payload', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        facilityId: 'facility-1',
        roleId: 'role-1',
        role: { name: 'Operator' },
        facility: { name: 'Main Arena' },
      }

      mockAuth.authenticate.mockResolvedValue(mockUser as any)
      mockAuth.generateToken.mockReturnValue('mock-token')
      mockAuth.setAuthCookie.mockResolvedValue(undefined)
      ;(mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({})

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      await loginHandler(request)

      expect(mockAuth.generateToken).toHaveBeenCalledWith({
        userId: 'user-1',
        email: 'test@example.com',
        facilityId: 'facility-1',
        roleId: 'role-1',
      })
    })

    it('should set auth cookie on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        facilityId: 'facility-1',
        roleId: 'role-1',
        role: { name: 'Operator' },
        facility: { name: 'Main Arena' },
      }

      mockAuth.authenticate.mockResolvedValue(mockUser as any)
      mockAuth.generateToken.mockReturnValue('mock-token')
      mockAuth.setAuthCookie.mockResolvedValue(undefined)
      ;(mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({})

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      await loginHandler(request)

      expect(mockAuth.setAuthCookie).toHaveBeenCalledWith('mock-token')
    })

    it('should create audit log on successful login', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        facilityId: 'facility-1',
        roleId: 'role-1',
        role: { name: 'Operator' },
        facility: { name: 'Main Arena' },
      }

      mockAuth.authenticate.mockResolvedValue(mockUser as any)
      mockAuth.generateToken.mockReturnValue('mock-token')
      mockAuth.setAuthCookie.mockResolvedValue(undefined)
      ;(mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({})

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      await loginHandler(request)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'LOGIN',
          entityType: 'User',
          entityId: 'user-1',
        },
      })
    })

    it('should return 500 on internal error', async () => {
      mockAuth.authenticate.mockRejectedValue(new Error('Database error'))

      const request = createRequest({
        email: 'test@example.com',
        password: 'password123',
      })

      const response = await loginHandler(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('An error occurred during login')
    })
  })
})
