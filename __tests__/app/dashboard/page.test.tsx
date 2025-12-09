import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from '@/app/dashboard/page'
import * as auth from '@/lib/auth'
import * as permissions from '@/lib/permissions'
import type { PermissionSet, ModuleType } from '@/types'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

// Mock the permissions module
vi.mock('@/lib/permissions', () => ({
  getUserPermissions: vi.fn(),
  getAccessibleModules: vi.fn(),
}))

const mockPermissions: PermissionSet = {
  admin: { access: false },
  iceDepth: { access: true, submit: true, viewOwn: true },
  iceOperations: { access: true, submit: true, viewOwn: true },
  refrigeration: { access: true, submit: true, viewOwn: true },
  airQuality: { access: true, submit: true, viewOwn: true },
  incidents: { access: true, submit: true, viewOwn: true },
  schedule: { access: true, viewOwn: true },
  dailyChecklist: { access: true, submit: true, viewOwn: true },
}

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: null,
  isActive: true,
  roleId: 'role-123',
  facilityId: 'facility-123',
  permissionOverrides: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: {
    id: 'role-123',
    name: 'Operator',
    description: 'Basic operator',
    permissions: mockPermissions,
    facilityId: 'facility-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  facility: {
    id: 'facility-123',
    name: 'Ice Arena',
    address: '123 Main St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    timezone: 'America/New_York',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

const mockAccessibleModules: ModuleType[] = [
  'iceDepth',
  'iceOperations',
  'refrigeration',
  'airQuality',
  'incidents',
  'schedule',
  'dailyChecklist',
]

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('When user is authenticated', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)
      vi.mocked(permissions.getAccessibleModules).mockReturnValue(mockAccessibleModules)
    })

    it('should render welcome message with user first name', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText(/welcome back, john!/i)).toBeInTheDocument()
    })

    it('should render facility name', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText(/ice arena/i)).toBeInTheDocument()
    })

    it('should render user role', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText(/operator/i)).toBeInTheDocument()
    })

    it('should render Quick Stats card', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText('Quick Stats')).toBeInTheDocument()
    })

    it('should render Recent Activity card', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    })

    it('should render Alerts card', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText('Alerts')).toBeInTheDocument()
    })

    it('should render Your Access section', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText('Your Access')).toBeInTheDocument()
      expect(screen.getByText(/you have access to the following modules/i)).toBeInTheDocument()
    })

    it('should render accessible modules as badges', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText('iceDepth')).toBeInTheDocument()
      expect(screen.getByText('iceOperations')).toBeInTheDocument()
      expect(screen.getByText('refrigeration')).toBeInTheDocument()
      expect(screen.getByText('airQuality')).toBeInTheDocument()
      expect(screen.getByText('incidents')).toBeInTheDocument()
      expect(screen.getByText('schedule')).toBeInTheDocument()
      expect(screen.getByText('dailyChecklist')).toBeInTheDocument()
    })

    it('should render development status section', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText(/development status/i)).toBeInTheDocument()
      expect(screen.getByText(/phase 1: foundation - complete!/i)).toBeInTheDocument()
    })

    it('should call getSession on render', async () => {
      await DashboardPage()

      expect(auth.getSession).toHaveBeenCalled()
    })

    it('should call getUserPermissions with user', async () => {
      await DashboardPage()

      expect(permissions.getUserPermissions).toHaveBeenCalledWith(mockUser)
    })

    it('should call getAccessibleModules with user', async () => {
      await DashboardPage()

      expect(permissions.getAccessibleModules).toHaveBeenCalledWith(mockUser)
    })
  })

  describe('When user is not authenticated', () => {
    it('should return null when no session', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(null)

      const page = await DashboardPage()

      expect(page).toBeNull()
    })

    it('should not call getUserPermissions when no user', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(null)

      await DashboardPage()

      expect(permissions.getUserPermissions).not.toHaveBeenCalled()
    })

    it('should not call getAccessibleModules when no user', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(null)

      await DashboardPage()

      expect(permissions.getAccessibleModules).not.toHaveBeenCalled()
    })
  })

  describe('Different user roles', () => {
    it('should display GM role and all modules', async () => {
      const gmUser = {
        ...mockUser,
        firstName: 'Sarah',
        role: { ...mockUser.role, name: 'GM' },
      }
      const allModules: ModuleType[] = [
        'admin',
        'iceDepth',
        'iceOperations',
        'refrigeration',
        'airQuality',
        'incidents',
        'schedule',
        'dailyChecklist',
      ]

      vi.mocked(auth.getSession).mockResolvedValue(gmUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)
      vi.mocked(permissions.getAccessibleModules).mockReturnValue(allModules)

      const page = await DashboardPage()
      render(page)

      expect(screen.getByText(/welcome back, sarah!/i)).toBeInTheDocument()
      // Role is displayed with facility: "Ice Arena • GM"
      expect(screen.getByText(/GM/)).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('should display Supervisor role', async () => {
      const supervisorUser = {
        ...mockUser,
        firstName: 'Mike',
        role: { ...mockUser.role, name: 'Supervisor' },
        facility: { ...mockUser.facility, name: 'Downtown Rink' },
      }

      vi.mocked(auth.getSession).mockResolvedValue(supervisorUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)
      vi.mocked(permissions.getAccessibleModules).mockReturnValue(mockAccessibleModules)

      const page = await DashboardPage()
      render(page)

      expect(screen.getByText(/welcome back, mike!/i)).toBeInTheDocument()
      // Role and facility displayed together: "Downtown Rink • Supervisor"
      expect(screen.getByText(/Supervisor/)).toBeInTheDocument()
      expect(screen.getByText(/Downtown Rink/i)).toBeInTheDocument()
    })

    it('should display limited modules for restricted user', async () => {
      const limitedModules: ModuleType[] = ['iceDepth', 'iceOperations']

      vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)
      vi.mocked(permissions.getAccessibleModules).mockReturnValue(limitedModules)

      const page = await DashboardPage()
      render(page)

      expect(screen.getByText('iceDepth')).toBeInTheDocument()
      expect(screen.getByText('iceOperations')).toBeInTheDocument()
      expect(screen.queryByText('refrigeration')).not.toBeInTheDocument()
      expect(screen.queryByText('admin')).not.toBeInTheDocument()
    })
  })

  describe('Content structure', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)
      vi.mocked(permissions.getAccessibleModules).mockReturnValue(mockAccessibleModules)
    })

    it('should have three info cards in a grid', async () => {
      const page = await DashboardPage()
      render(page)

      const quickStats = screen.getByText('Quick Stats')
      const recentActivity = screen.getByText('Recent Activity')
      const alerts = screen.getByText('Alerts')

      expect(quickStats).toBeInTheDocument()
      expect(recentActivity).toBeInTheDocument()
      expect(alerts).toBeInTheDocument()
    })

    it('should show coming soon messages in cards', async () => {
      const page = await DashboardPage()
      render(page)

      const comingSoonMessages = screen.getAllByText(/coming soon/i)
      expect(comingSoonMessages.length).toBeGreaterThanOrEqual(3)
    })

    it('should show development checklist items', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText(/next.js project initialized/i)).toBeInTheDocument()
      expect(screen.getByText(/prisma database schema configured/i)).toBeInTheDocument()
      expect(screen.getByText(/authentication system implemented/i)).toBeInTheDocument()
      expect(screen.getByText(/role-based access control/i)).toBeInTheDocument()
      expect(screen.getByText(/basic dashboard layout/i)).toBeInTheDocument()
    })

    it('should show next steps message', async () => {
      const page = await DashboardPage()
      render(page)

      expect(screen.getByText(/next up: form builder and report modules!/i)).toBeInTheDocument()
    })
  })
})
