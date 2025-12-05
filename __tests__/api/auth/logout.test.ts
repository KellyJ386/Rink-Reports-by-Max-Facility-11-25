import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/logout/route'
import * as auth from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock the auth module
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual('@/lib/auth')
  return {
    ...actual,
    getSession: vi.fn(),
    clearAuthCookie: vi.fn(),
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

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return success when logging out authenticated user', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(auth.clearAuthCookie).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should create audit log entry when user is authenticated', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(auth.clearAuthCookie).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    await POST()

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        action: 'LOGOUT',
        entityType: 'User',
        entityId: mockUser.id,
      },
    })
  })

  it('should clear auth cookie on logout', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(auth.clearAuthCookie).mockResolvedValue(undefined)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)

    await POST()

    expect(auth.clearAuthCookie).toHaveBeenCalled()
  })

  it('should return success even when no user session exists', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(null)
    vi.mocked(auth.clearAuthCookie).mockResolvedValue(undefined)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('should not create audit log when no user session exists', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(null)
    vi.mocked(auth.clearAuthCookie).mockResolvedValue(undefined)

    await POST()

    expect(prisma.auditLog.create).not.toHaveBeenCalled()
  })

  it('should still clear cookie when no user session exists', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(null)
    vi.mocked(auth.clearAuthCookie).mockResolvedValue(undefined)

    await POST()

    expect(auth.clearAuthCookie).toHaveBeenCalled()
  })

  it('should return 500 when an error occurs', async () => {
    vi.mocked(auth.getSession).mockRejectedValue(new Error('Session error'))

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An error occurred during logout')
  })

  it('should return 500 when clearing cookie fails', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any)
    vi.mocked(auth.clearAuthCookie).mockRejectedValue(new Error('Cookie error'))

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An error occurred during logout')
  })
})
