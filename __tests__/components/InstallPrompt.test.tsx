import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'

describe('InstallPrompt', () => {
  let originalMatchMedia: typeof window.matchMedia
  let originalLocalStorage: Storage

  beforeEach(() => {
    jest.clearAllMocks()

    // Save originals
    originalMatchMedia = window.matchMedia
    originalLocalStorage = window.localStorage

    // Mock matchMedia to indicate not installed
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false, // Not in standalone mode
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    // Mock localStorage
    const localStorageMock: Record<string, string> = {}
    Object.defineProperty(window, 'localStorage', {
      writable: true,
      value: {
        getItem: jest.fn((key: string) => localStorageMock[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          localStorageMock[key] = value
        }),
        removeItem: jest.fn((key: string) => {
          delete localStorageMock[key]
        }),
        clear: jest.fn(),
      },
    })
  })

  afterEach(() => {
    // Restore originals
    window.matchMedia = originalMatchMedia
  })

  it('should not render if already installed', () => {
    // Mock as installed (standalone mode)
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query.includes('standalone'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    })

    const { container } = render(<InstallPrompt />)
    expect(container.firstChild).toBeNull()
  })

  it('should not render if dismissed within 7 days', () => {
    const recentDate = new Date()
    recentDate.setDate(recentDate.getDate() - 3) // 3 days ago
    ;(window.localStorage.getItem as jest.Mock).mockReturnValue(recentDate.toISOString())

    const { container } = render(<InstallPrompt />)
    expect(container.firstChild).toBeNull()
  })

  it('should show prompt when beforeinstallprompt event fires', async () => {
    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      expect(screen.getByText('Install MFO App')).toBeInTheDocument()
    })
  })

  it('should show install description', async () => {
    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      expect(screen.getByText(/Install the app for quick access/i)).toBeInTheDocument()
    })
  })

  it('should have Install button', async () => {
    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /install/i })).toBeInTheDocument()
    })
  })

  it('should have Not now button', async () => {
    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /not now/i })).toBeInTheDocument()
    })
  })

  it('should hide prompt when Not now clicked', async () => {
    const user = userEvent.setup()
    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      expect(screen.getByText('Install MFO App')).toBeInTheDocument()
    })

    const notNowButton = screen.getByRole('button', { name: /not now/i })
    await user.click(notNowButton)

    await waitFor(() => {
      expect(screen.queryByText('Install MFO App')).not.toBeInTheDocument()
    })
  })

  it('should save dismiss date to localStorage', async () => {
    const user = userEvent.setup()
    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      expect(screen.getByText('Install MFO App')).toBeInTheDocument()
    })

    const notNowButton = screen.getByRole('button', { name: /not now/i })
    await user.click(notNowButton)

    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'pwa-install-dismissed',
      expect.any(String)
    )
  })

  it('should call prompt when Install clicked', async () => {
    const user = userEvent.setup()
    const mockPrompt = jest.fn()

    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: mockPrompt })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'accepted' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      expect(screen.getByText('Install MFO App')).toBeInTheDocument()
    })

    const installButton = screen.getByRole('button', { name: /^install$/i })
    await user.click(installButton)

    expect(mockPrompt).toHaveBeenCalled()
  })

  it('should hide prompt when user accepts install', async () => {
    const user = userEvent.setup()

    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'accepted' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      expect(screen.getByText('Install MFO App')).toBeInTheDocument()
    })

    const installButton = screen.getByRole('button', { name: /^install$/i })
    await user.click(installButton)

    await waitFor(() => {
      expect(screen.queryByText('Install MFO App')).not.toBeInTheDocument()
    })
  })

  it('should hide prompt on appinstalled event', async () => {
    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const beforeInstallEvent = new Event('beforeinstallprompt')
    Object.defineProperty(beforeInstallEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(beforeInstallEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    })

    window.dispatchEvent(beforeInstallEvent)

    await waitFor(() => {
      expect(screen.getByText('Install MFO App')).toBeInTheDocument()
    })

    // Simulate appinstalled event
    window.dispatchEvent(new Event('appinstalled'))

    await waitFor(() => {
      expect(screen.queryByText('Install MFO App')).not.toBeInTheDocument()
    })
  })

  it('should have close button (X)', async () => {
    render(<InstallPrompt />)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.defineProperty(mockEvent, 'prompt', { value: jest.fn() })
    Object.defineProperty(mockEvent, 'userChoice', {
      value: Promise.resolve({ outcome: 'dismissed' }),
    })

    window.dispatchEvent(mockEvent)

    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      // Should have Install, Not now, and close (X) buttons
      expect(buttons.length).toBeGreaterThanOrEqual(3)
    })
  })
})
