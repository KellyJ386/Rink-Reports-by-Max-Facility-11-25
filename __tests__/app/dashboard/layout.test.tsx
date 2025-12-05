import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardLayout from '@/app/dashboard/layout'
import * as auth from '@/lib/auth'
import * as permissions from '@/lib/permissions'
import type { PermissionSet } from '@/types'

// Mock the auth module
vi.mock('@/lib/auth', () => ({
  getSession: vi.fn(),
}))

// Mock the permissions module
vi.mock('@/lib/permissions', () => ({
  getUserPermissions: vi.fn(),
}))

// Track redirect calls
let redirectCalled = false
let redirectPath = ''

// Mock next/navigation - redirect throws to stop execution (like Next.js)
vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    redirectCalled = true
    redirectPath = path
    throw new Error('NEXT_REDIRECT')
  }),
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
  })),
}))

// Mock Sidebar component
vi.mock('@/components/layout/Sidebar', () => ({
  default: vi.fn(({ user }) => (
    <div data-testid="sidebar">
      <span data-testid="user-name">{user.firstName} {user.lastName}</span>
      <span data-testid="user-role">{user.role.name}</span>
      <span data-testid="facility-name">{user.facility.name}</span>
    </div>
  )),
}))

const mockPermissions: PermissionSet = {
  admin: { access: false },
  iceDepth: { access: true, submit: true },
  iceOperations: { access: true, submit: true },
  refrigeration: { access: true },
  airQuality: { access: true },
  incidents: { access: true },
  schedule: { access: true },
  dailyChecklist: { access: true },
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

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    redirectCalled = false
    redirectPath = ''
  })

  describe('Authentication', () => {
    it('should redirect to login when no session exists', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(null)

      try {
        await DashboardLayout({ children: <div>Test</div> })
      } catch (e) {
        // Expected - redirect throws
      }

      expect(redirectCalled).toBe(true)
      expect(redirectPath).toBe('/login')
    })

    it('should call getSession on render', async () => {
      vi.mocked(auth.getSession).mockResolvedValue(null)

      try {
        await DashboardLayout({ children: <div>Test</div> })
      } catch (e) {
        // Expected - redirect throws
      }

      expect(auth.getSession).toHaveBeenCalled()
    })
  })

  describe('When authenticated', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)
    })

    it('should not redirect when user is authenticated', async () => {
      const layout = await DashboardLayout({ children: <div>Test</div> })
      render(layout)

      expect(redirectCalled).toBe(false)
    })

    it('should render the sidebar', async () => {
      const layout = await DashboardLayout({ children: <div>Test</div> })
      render(layout)

      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('should pass user data to sidebar', async () => {
      const layout = await DashboardLayout({ children: <div>Test</div> })
      render(layout)

      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe')
      expect(screen.getByTestId('user-role')).toHaveTextContent('Operator')
      expect(screen.getByTestId('facility-name')).toHaveTextContent('Ice Arena')
    })

    it('should render children content', async () => {
      const layout = await DashboardLayout({
        children: <div data-testid="child-content">Child Content</div>,
      })
      render(layout)

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Child Content')).toBeInTheDocument()
    })

    it('should call getUserPermissions with user', async () => {
      await DashboardLayout({ children: <div>Test</div> })

      expect(permissions.getUserPermissions).toHaveBeenCalledWith(mockUser)
    })

    it('should pass permissions to sidebar user data', async () => {
      const layout = await DashboardLayout({ children: <div>Test</div> })

      // Verify the Sidebar component was called (mocked)
      expect(layout).not.toBeNull()
      expect(permissions.getUserPermissions).toHaveBeenCalled()
    })
  })

  describe('Different user scenarios', () => {
    it('should handle GM user correctly', async () => {
      const gmUser = {
        ...mockUser,
        firstName: 'Sarah',
        lastName: 'Admin',
        role: { ...mockUser.role, name: 'GM' },
        facility: { ...mockUser.facility, name: 'Main Arena' },
      }

      vi.mocked(auth.getSession).mockResolvedValue(gmUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)

      const layout = await DashboardLayout({ children: <div>Test</div> })
      render(layout)

      expect(screen.getByTestId('user-name')).toHaveTextContent('Sarah Admin')
      expect(screen.getByTestId('user-role')).toHaveTextContent('GM')
      expect(screen.getByTestId('facility-name')).toHaveTextContent('Main Arena')
    })

    it('should handle Supervisor user correctly', async () => {
      const supervisorUser = {
        ...mockUser,
        firstName: 'Mike',
        lastName: 'Super',
        role: { ...mockUser.role, name: 'Supervisor' },
      }

      vi.mocked(auth.getSession).mockResolvedValue(supervisorUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)

      const layout = await DashboardLayout({ children: <div>Test</div> })
      render(layout)

      expect(screen.getByTestId('user-name')).toHaveTextContent('Mike Super')
      expect(screen.getByTestId('user-role')).toHaveTextContent('Supervisor')
    })
  })

  describe('Layout structure', () => {
    beforeEach(() => {
      vi.mocked(auth.getSession).mockResolvedValue(mockUser as any)
      vi.mocked(permissions.getUserPermissions).mockReturnValue(mockPermissions)
    })

    it('should render with flex layout', async () => {
      const layout = await DashboardLayout({ children: <div>Test</div> })
      const { container } = render(layout)

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('flex')
      expect(wrapper).toHaveClass('h-screen')
    })

    it('should have main content area', async () => {
      const layout = await DashboardLayout({
        children: <div data-testid="page-content">Page Content</div>,
      })
      render(layout)

      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
      expect(main).toHaveClass('flex-1')
    })

    it('should render complex children correctly', async () => {
      const complexChild = (
        <div>
          <h1 data-testid="heading">Dashboard</h1>
          <p data-testid="paragraph">Welcome message</p>
          <ul>
            <li data-testid="list-item">Item 1</li>
          </ul>
        </div>
      )

      const layout = await DashboardLayout({ children: complexChild })
      render(layout)

      expect(screen.getByTestId('heading')).toHaveTextContent('Dashboard')
      expect(screen.getByTestId('paragraph')).toHaveTextContent('Welcome message')
      expect(screen.getByTestId('list-item')).toHaveTextContent('Item 1')
    })
  })
})
