import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/auth/me/route'
import * as auth from '@/lib/auth'
import * as permissions from '@/lib/permissions'
import type { PermissionSet } from '@/types'

// Mock the auth module
vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual('@/lib/auth')
  return {
    ...actual,
    getSession: vi.fn(),
  }
})

// Mock the permissions module
vi.mock('@/lib/permissions', async () => {
  const actual = await vi.importActual('@/lib/permissions')
  return {
    ...actual,
    getUserPermissions: vi.fn(),
  }
})

const mockPermissions: PermissionSet = {
  admin: { access: false },
  iceDepth: { access: true, submit: true, viewOwn: true, viewAll: false },
  iceOperations: { access: true, submit: true, viewOwn: true, viewAll: false },
  refrigeration: { access: true, submit: true, viewOwn: true, viewAll: false },
  airQuality: { access: true, submit: true, viewOwn: true, viewAll: false },
  incidents: { access: true, submit: true, viewOwn: true, viewAll: false },
  schedule: { access: true, viewOwn: true, viewAll: false },
  dailyChecklist: { access: true, submit: true, viewOwn: true, viewAll: false },
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  phone: '+1234567890',
  roleId: 'role-123',
  facilityId: 'facility-123',
  permissionOverrides: null,
  role: {
    id: 'role-123',
    name: 'Operator',
    permissions: mockPermissions,
  },
  facility: {
    id: 'facility-123',
    name: 'Test Facility',
  },
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return 401 when not authenticated', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(null)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Not authenticated')
  })

  it('should return user data with permissions when authenticated', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual({
      id: mockUser.id,
      email: mockUser.email,
      firstName: mockUser.firstName,
      lastName: mockUser.lastName,
      phone: mockUser.phone,
      role: {
        id: mockUser.role.id,
        name: mockUser.role.name,
      },
      facility: {
        id: mockUser.facility.id,
        name: mockUser.facility.name,
      },
      permissions: mockPermissions,
    })
  })

  it('should call getUserPermissions with the user', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)

    await GET()

    expect(permissions.getUserPermissions).toHaveBeenCalledWith(mockUser)
  })

  it('should handle user with null phone', async () => {
    const userWithNullPhone = { ...mockUser, phone: null }
    vi.mocked(auth.getSession).mockResolvedValue(userWithNullPhone as any)
    vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.phone).toBeNull()
  })

  it('should include correct role structure', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)

    const response = await GET()
    const data = await response.json()

    expect(data.user.role).toEqual({
      id: 'role-123',
      name: 'Operator',
    })
  })

  it('should include correct facility structure', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)

    const response = await GET()
    const data = await response.json()

    expect(data.user.facility).toEqual({
      id: 'facility-123',
      name: 'Test Facility',
    })
  })

  it('should return 500 when an error occurs', async () => {
    vi.mocked(auth.getSession).mockRejectedValue(new Error('Session error'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An error occurred')
  })

  it('should return 500 when getUserPermissions throws', async () => {
    vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
    vi.mocked(permissions.getUserPermissions).mockImplementation(() => {
      throw new Error('Permission error')
    })

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('An error occurred')
  })

  describe('different user roles', () => {
    it('should return admin user with admin permissions', async () => {
      const adminPermissions: PermissionSet = {
        admin: { access: true, viewAll: true, edit: true, delete: true },
        iceDepth: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
        iceOperations: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
        refrigeration: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
        airQuality: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
        incidents: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true, approve: true },
        schedule: { access: true, viewOwn: true, viewAll: true, edit: true, create: true, publish: true },
        dailyChecklist: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true, delete: true },
      }

      const adminUser = {
        ...mockUser,
        role: { id: 'admin-role', name: 'GM' },
      }

      vi.mocked(auth.getSession).mockResolvedValue(adminUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(adminPermissions)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.role.name).toBe('GM')
      expect(data.user.permissions.admin.access).toBe(true)
    })

    it('should return supervisor user with limited permissions', async () => {
      const supervisorPermissions: PermissionSet = {
        admin: { access: false },
        iceDepth: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true },
        iceOperations: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true },
        refrigeration: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true },
        airQuality: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true },
        incidents: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true },
        schedule: { access: true, viewOwn: true, viewAll: true },
        dailyChecklist: { access: true, submit: true, viewOwn: true, viewAll: true, edit: true },
      }

      const supervisorUser = {
        ...mockUser,
        role: { id: 'supervisor-role', name: 'Supervisor' },
      }

      vi.mocked(auth.getSession).mockResolvedValue(supervisorUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(supervisorPermissions)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.user.role.name).toBe('Supervisor')
      expect(data.user.permissions.admin.access).toBe(false)
      expect(data.user.permissions.iceDepth.viewAll).toBe(true)
    })
  })
})
