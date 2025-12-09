import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/auth/login/route'
import * as auth from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock the auth module
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual('@/lib/auth')
  return {
    ...actual,
    authenticate: vi.fn(),
    generateToken: vi.fn(),
    setAuthCookie: vi.fn(),
  }
})

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
    },
  },
}))

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  roleId: 'role-123',
  facilityId: 'facility-123',
  role: {
    id: 'role-123',
    name: 'Operator',
  },
  facility: {
    id: 'facility-123',
    name: 'Test Facility',
  },
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 400 when email is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'password123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should return 400 when password is missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should return 400 when both email and password are missing', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Email and password are required')
  })

  it('should return 401 for invalid credentials', async () => {
    vi.mocked(auth.authenticate).mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'wrongpassword' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Invalid email or password')
    expect(auth.authenticate).toHaveBeenCalledWith('test@example.com', 'wrongpassword')
  })

  it('should return success with user data for valid credentials', async () => {
    vi.mocked(auth.authenticate).mockResolvedValue(mockUser as any)
    vi.mocked(auth.generateToken).mockReturnValue('mock-jwt-token')
    vi.mocked(auth.setAuthCookie).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'correctpassword' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      role: mockUser.role.name,
      facility: mockUser.facility.name,
    })
  })

  it('should generate JWT token with correct payload', async () => {
    vi.mocked(auth.authenticate).mockResolvedValue(mockUser as any)
    vi.mocked(auth.generateToken).mockReturnValue('mock-jwt-token')
    vi.mocked(auth.setAuthCookie).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'correctpassword' }),
    })

    await POST(request)

    expect(auth.generateToken).toHaveBeenCalledWith({
      userId: mockUser.id,
      email: mockUser.email,
      facilityId: mockUser.facilityId,
      roleId: mockUser.roleId,
    })
  })

  it('should set auth cookie after successful login', async () => {
    vi.mocked(auth.authenticate).mockResolvedValue(mockUser as any)
    vi.mocked(auth.generateToken).mockReturnValue('mock-jwt-token')
    vi.mocked(auth.setAuthCookie).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'correctpassword' }),
    })

    await POST(request)

    expect(auth.setAuthCookie).toHaveBeenCalledWith('mock-jwt-token')
  })

  it('should create audit log entry for successful login', async () => {
    vi.mocked(auth.authenticate).mockResolvedValue(mockUser as any)
    vi.mocked(auth.generateToken).mockReturnValue('mock-jwt-token')
    vi.mocked(auth.setAuthCookie).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'correctpassword' }),
    })

    await POST(request)

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: mockUser.id,
      },
    })
  })

  it('should return 500 when an error occurs', async () => {
    vi.mocked(auth.authenticate).mockRejectedValue(new Error('Database error'))

    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An error occurred during login')
  })

  it('should handle malformed JSON body', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: 'invalid json',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An error occurred during login')
  })
})
