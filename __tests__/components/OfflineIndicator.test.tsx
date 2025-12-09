import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator'
import * as offline from '@/lib/offline'

// Mock the offline module
jest.mock('@/lib/offline', () => ({
  isOnline: jest.fn(),
  onNetworkChange: jest.fn(),
}))

describe('OfflineIndicator', () => {
  const mockOffline = offline as jest.Mocked<typeof offline>
  let networkChangeCallback: ((online: boolean) => void) | null = null

  beforeEach(() => {
    jest.clearAllMocks()
    networkChangeCallback = null

    // Default to online
    mockOffline.isOnline.mockReturnValue(true)
    mockOffline.onNetworkChange.mockImplementation((callback) => {
      networkChangeCallback = callback
      return () => { networkChangeCallback = null }
    })
  })

  it('should not render when online and no banner shown', () => {
    mockOffline.isOnline.mockReturnValue(true)

    const { container } = render(<OfflineIndicator />)

    expect(container.firstChild).toBeNull()
  })

  it('should render offline banner when offline', () => {
    mockOffline.isOnline.mockReturnValue(false)

    render(<OfflineIndicator />)

    // Simulate going offline
    if (networkChangeCallback) {
      networkChangeCallback(false)
    }

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument()
  })

  it('should show yellow banner when offline', async () => {
    mockOffline.isOnline.mockReturnValue(false)

    render(<OfflineIndicator />)

    // Simulate going offline
    if (networkChangeCallback) {
      networkChangeCallback(false)
    }

    await waitFor(() => {
      const banner = screen.getByText(/You're offline/i).closest('div[class*="fixed"]')
      expect(banner).toHaveClass('bg-yellow-600')
    })
  })

  it('should show green banner when back online', async () => {
    mockOffline.isOnline.mockReturnValue(false)

    render(<OfflineIndicator />)

    // Go offline first
    if (networkChangeCallback) {
      networkChangeCallback(false)
    }

    expect(screen.getByText(/You're offline/i)).toBeInTheDocument()

    // Come back online
    if (networkChangeCallback) {
      networkChangeCallback(true)
    }

    await waitFor(() => {
      expect(screen.getByText(/Back online/i)).toBeInTheDocument()
      const banner = screen.getByText(/Back online/i).closest('div[class*="fixed"]')
      expect(banner).toHaveClass('bg-green-600')
    })
  })

  it('should show close button when back online', async () => {
    mockOffline.isOnline.mockReturnValue(false)

    render(<OfflineIndicator />)

    // Go offline
    if (networkChangeCallback) {
      networkChangeCallback(false)
    }

    // No close button when offline
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    // Come back online
    if (networkChangeCallback) {
      networkChangeCallback(true)
    }

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  it('should hide banner when close button clicked', async () => {
    const user = userEvent.setup()
    mockOffline.isOnline.mockReturnValue(false)

    render(<OfflineIndicator />)

    // Go offline
    if (networkChangeCallback) {
      networkChangeCallback(false)
    }

    // Come back online (shows close button)
    if (networkChangeCallback) {
      networkChangeCallback(true)
    }

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    const closeButton = screen.getByRole('button')
    await user.click(closeButton)

    // Banner should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Back online/i)).not.toBeInTheDocument()
    })
  })

  it('should call onNetworkChange with callback on mount', () => {
    render(<OfflineIndicator />)

    expect(mockOffline.onNetworkChange).toHaveBeenCalled()
    expect(networkChangeCallback).not.toBeNull()
  })

  it('should unsubscribe on unmount', () => {
    const unsubscribe = jest.fn()
    mockOffline.onNetworkChange.mockReturnValue(unsubscribe)

    const { unmount } = render(<OfflineIndicator />)

    unmount()

    expect(unsubscribe).toHaveBeenCalled()
  })

  it('should show syncing message when back online', async () => {
    mockOffline.isOnline.mockReturnValue(false)

    render(<OfflineIndicator />)

    // Go offline
    if (networkChangeCallback) {
      networkChangeCallback(false)
    }

    // Come back online
    if (networkChangeCallback) {
      networkChangeCallback(true)
    }

    await waitFor(() => {
      expect(screen.getByText(/syncing changes/i)).toBeInTheDocument()
    })
  })

  it('should display offline icon', async () => {
    mockOffline.isOnline.mockReturnValue(false)

    render(<OfflineIndicator />)

    // Go offline
    if (networkChangeCallback) {
      networkChangeCallback(false)
    }

    await waitFor(() => {
      // The lightning bolt icon is displayed as text
      expect(screen.getByText(/⚡/)).toBeInTheDocument()
    })
  })

  it('should display checkmark when online', async () => {
    mockOffline.isOnline.mockReturnValue(false)

    render(<OfflineIndicator />)

    // Go offline
    if (networkChangeCallback) {
      networkChangeCallback(false)
    }

    // Come back online
    if (networkChangeCallback) {
      networkChangeCallback(true)
    }

    await waitFor(() => {
      expect(screen.getByText(/✓/)).toBeInTheDocument()
    })
  })
})
