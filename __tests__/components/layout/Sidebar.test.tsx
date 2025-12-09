import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Sidebar from '@/components/layout/Sidebar'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/dashboard'),
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}))

// Mock fetch
global.fetch = vi.fn()

// Create user with full permissions
const createFullPermissionsUser = () => ({
  firstName: 'Test',
  lastName: 'User',
  role: { name: 'GM' },
  facility: { name: 'Test Arena' },
  permissions: {
    admin: { access: true },
    iceDepth: { access: true },
    iceOperations: { access: true },
    refrigeration: { access: true },
    airQuality: { access: true },
    incidents: { access: true },
    schedule: { access: true },
    dailyChecklist: { access: true },
  },
})

// Create user with limited permissions (operator)
const createOperatorUser = () => ({
  firstName: 'John',
  lastName: 'Operator',
  role: { name: 'Operator' },
  facility: { name: 'Ice Palace' },
  permissions: {
    admin: { access: false },
    iceDepth: { access: true },
    iceOperations: { access: true },
    refrigeration: { access: true },
    airQuality: { access: true },
    incidents: { access: true },
    schedule: { access: true },
    dailyChecklist: { access: true },
  },
})

describe('Sidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response)
  })

  describe('Rendering', () => {
    it('should render the MFO header', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('MFO')).toBeInTheDocument()
    })

    it('should render the facility name', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('Test Arena')).toBeInTheDocument()
    })

    it('should render user name', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should render user role', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('GM')).toBeInTheDocument()
    })

    it('should render sign out button', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
    })
  })

  describe('Navigation Items - Full Permissions', () => {
    it('should render Dashboard link for all users', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should render all module links for admin user', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('Ice Depth')).toBeInTheDocument()
      expect(screen.getByText('Ice Operations')).toBeInTheDocument()
      expect(screen.getByText('Refrigeration')).toBeInTheDocument()
      expect(screen.getByText('Air Quality')).toBeInTheDocument()
      expect(screen.getByText('Incidents')).toBeInTheDocument()
      expect(screen.getByText('Schedule')).toBeInTheDocument()
      expect(screen.getByText('Checklists')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
    })

    it('should have correct href for Dashboard', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const dashboardLink = screen.getByText('Dashboard').closest('a')
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    })

    it('should have correct href for Ice Depth', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const iceDepthLink = screen.getByText('Ice Depth').closest('a')
      expect(iceDepthLink).toHaveAttribute('href', '/dashboard/ice-depth')
    })

    it('should have correct href for Admin', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const adminLink = screen.getByText('Admin').closest('a')
      expect(adminLink).toHaveAttribute('href', '/dashboard/admin')
    })
  })

  describe('Navigation Items - Limited Permissions', () => {
    it('should NOT render Admin link for operator user', () => {
      const user = createOperatorUser()
      render(<Sidebar user={user} />)

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
    })

    it('should render other module links for operator user', () => {
      const user = createOperatorUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Ice Depth')).toBeInTheDocument()
      expect(screen.getByText('Ice Operations')).toBeInTheDocument()
      expect(screen.getByText('Refrigeration')).toBeInTheDocument()
    })

    it('should render correct number of nav items based on permissions', () => {
      const user = createOperatorUser()
      render(<Sidebar user={user} />)

      // Operator should see all except Admin (8 items: Dashboard + 7 modules without admin)
      const navLinks = screen.getAllByRole('link')
      expect(navLinks).toHaveLength(8)
    })
  })

  describe('Permission-based filtering', () => {
    it('should hide Ice Depth when access is false', () => {
      const user = {
        ...createFullPermissionsUser(),
        permissions: {
          ...createFullPermissionsUser().permissions,
          iceDepth: { access: false },
        },
      }
      render(<Sidebar user={user} />)

      expect(screen.queryByText('Ice Depth')).not.toBeInTheDocument()
    })

    it('should hide multiple modules when access is false', () => {
      const user = {
        ...createFullPermissionsUser(),
        permissions: {
          admin: { access: false },
          iceDepth: { access: false },
          iceOperations: { access: false },
          refrigeration: { access: true },
          airQuality: { access: true },
          incidents: { access: false },
          schedule: { access: true },
          dailyChecklist: { access: false },
        },
      }
      render(<Sidebar user={user} />)

      expect(screen.queryByText('Admin')).not.toBeInTheDocument()
      expect(screen.queryByText('Ice Depth')).not.toBeInTheDocument()
      expect(screen.queryByText('Ice Operations')).not.toBeInTheDocument()
      expect(screen.queryByText('Incidents')).not.toBeInTheDocument()
      expect(screen.queryByText('Checklists')).not.toBeInTheDocument()

      // These should still be visible
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Refrigeration')).toBeInTheDocument()
      expect(screen.getByText('Air Quality')).toBeInTheDocument()
      expect(screen.getByText('Schedule')).toBeInTheDocument()
    })
  })

  describe('Logout functionality', () => {
    it('should call logout API when sign out button is clicked', async () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' })
      })
    })

    it('should redirect to login after logout', async () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('should call router.refresh after logout', async () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('should show "Signing out..." while logging out', async () => {
      // Make fetch hang to test loading state
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) } as Response), 100))
      )

      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      expect(screen.getByText('Signing out...')).toBeInTheDocument()
    })

    it('should disable button while logging out', async () => {
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({}) } as Response), 100))
      )

      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      expect(signOutButton).toBeDisabled()
    })

    it('should handle logout error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should re-enable button after logout error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      const signOutButton = screen.getByRole('button', { name: /sign out/i })
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(signOutButton).not.toBeDisabled()
        expect(screen.getByText('Sign Out')).toBeInTheDocument()
      })
    })
  })

  describe('User info display', () => {
    it('should display operator user info correctly', () => {
      const user = createOperatorUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('John Operator')).toBeInTheDocument()
      expect(screen.getByText('Operator')).toBeInTheDocument()
      expect(screen.getByText('Ice Palace')).toBeInTheDocument()
    })

    it('should display GM user info correctly', () => {
      const user = createFullPermissionsUser()
      render(<Sidebar user={user} />)

      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.getByText('GM')).toBeInTheDocument()
      expect(screen.getByText('Test Arena')).toBeInTheDocument()
    })
  })
})
