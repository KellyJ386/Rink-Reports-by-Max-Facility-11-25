import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationBell } from '@/components/notifications/NotificationBell'

// Mock fetch
global.fetch = jest.fn()

describe('NotificationBell', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'INCIDENT_SUBMITTED',
      title: 'New Incident Reported',
      message: 'An incident has been reported in the main rink',
      isRead: false,
      sentAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'SCHEDULE_PUBLISHED',
      title: 'Schedule Published',
      message: 'New schedule has been published',
      isRead: true,
      sentAt: new Date(Date.now() - 3600000).toISOString(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: mockNotifications, unreadCount: 1 }),
    })
  })

  it('should render the bell icon', async () => {
    render(<NotificationBell />)

    // Wait for fetch to complete
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications?limit=5')
    })

    // Bell should be visible
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('should show unread count badge', async () => {
    render(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument()
    })
  })

  it('should show 9+ when unread count exceeds 9', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: mockNotifications, unreadCount: 15 }),
    })

    render(<NotificationBell />)

    await waitFor(() => {
      expect(screen.getByText('9+')).toBeInTheDocument()
    })
  })

  it('should not show badge when no unread notifications', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    })

    render(<NotificationBell />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // No badge should be shown
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('should open dropdown when clicked', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const button = screen.getByRole('button')
    await user.click(button)

    expect(screen.getByText('Notifications')).toBeInTheDocument()
  })

  it('should display notifications in dropdown', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const button = screen.getByRole('button')
    await user.click(button)

    expect(screen.getByText('New Incident Reported')).toBeInTheDocument()
    expect(screen.getByText('Schedule Published')).toBeInTheDocument()
  })

  it('should show "No notifications" when empty', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: [], unreadCount: 0 }),
    })

    const user = userEvent.setup()
    render(<NotificationBell />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const button = screen.getByRole('button')
    await user.click(button)

    expect(screen.getByText('No notifications')).toBeInTheDocument()
  })

  it('should show "Mark all read" button when there are unread', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const button = screen.getByRole('button')
    await user.click(button)

    expect(screen.getByText('Mark all read')).toBeInTheDocument()
  })

  it('should call markAllRead API when button clicked', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const button = screen.getByRole('button')
    await user.click(button)

    const markAllButton = screen.getByText('Mark all read')
    await user.click(markAllButton)

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'markAllRead' }),
    })
  })

  it('should mark individual notification as read when clicked', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Open dropdown
    const bellButton = screen.getByRole('button')
    await user.click(bellButton)

    // Click unread notification
    const notification = screen.getByText('New Incident Reported').closest('div[class*="cursor-pointer"]')
    if (notification) {
      await user.click(notification)
    }

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/1', { method: 'PUT' })
  })

  it('should show View all notifications link', async () => {
    const user = userEvent.setup()
    render(<NotificationBell />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    const button = screen.getByRole('button')
    await user.click(button)

    const viewAllLink = screen.getByText('View all notifications')
    expect(viewAllLink).toBeInTheDocument()
    expect(viewAllLink).toHaveAttribute('href', '/dashboard/notifications')
  })

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <NotificationBell />
        <div data-testid="outside">Outside area</div>
      </div>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })

    // Open dropdown
    const button = screen.getByRole('button')
    await user.click(button)
    expect(screen.getByText('Notifications')).toBeInTheDocument()

    // Click outside
    const outside = screen.getByTestId('outside')
    await user.click(outside)

    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('Notifications')).not.toBeInTheDocument()
    })
  })

  it('should handle fetch error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    render(<NotificationBell />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    // Component should still render
    expect(screen.getByRole('button')).toBeInTheDocument()

    consoleSpy.mockRestore()
  })
})
