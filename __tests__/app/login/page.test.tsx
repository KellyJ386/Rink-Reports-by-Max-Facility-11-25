import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'

// Mock Next.js navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}))

// Mock fetch
global.fetch = vi.fn()

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the MFO header', () => {
      render(<LoginPage />)

      expect(screen.getByText('MFO')).toBeInTheDocument()
    })

    it('should render the subtitle', () => {
      render(<LoginPage />)

      expect(screen.getByText('Max Facility Operations')).toBeInTheDocument()
      expect(screen.getByText('Ice Rink Management')).toBeInTheDocument()
    })

    it('should render email input', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
    })

    it('should render password input', () => {
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toBeInTheDocument()
      expect(passwordInput).toHaveAttribute('type', 'password')
    })

    it('should render sign in button', () => {
      render(<LoginPage />)

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('should render demo account information', () => {
      render(<LoginPage />)

      expect(screen.getByText(/demo accounts available/i)).toBeInTheDocument()
      expect(screen.getByText('password123')).toBeInTheDocument()
      expect(screen.getByText(/gm@demo.com/i)).toBeInTheDocument()
      expect(screen.getByText(/manager@demo.com/i)).toBeInTheDocument()
      expect(screen.getByText(/supervisor@demo.com/i)).toBeInTheDocument()
      expect(screen.getByText(/operator@demo.com/i)).toBeInTheDocument()
    })

    it('should have email input with correct placeholder', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute('placeholder', 'you@example.com')
    })

    it('should have password input with correct placeholder', () => {
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('placeholder', '••••••••')
    })
  })

  describe('Form Validation', () => {
    it('should have required email field', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute('required')
    })

    it('should have required password field', () => {
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('required')
    })

    it('should allow typing in email field', async () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      await userEvent.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('should allow typing in password field', async () => {
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      await userEvent.type(passwordInput, 'password123')

      expect(passwordInput).toHaveValue('password123')
    })
  })

  describe('Form Submission - Success', () => {
    it('should call login API with credentials on submit', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, user: { id: '123' } }),
      } as Response)

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'password123')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      })
    })

    it('should redirect to dashboard on successful login', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, user: { id: '123' } }),
      } as Response)

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'password123')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })

    it('should call router.refresh on successful login', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, user: { id: '123' } }),
      } as Response)

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'password123')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('Form Submission - Failure', () => {
    it('should show error message on invalid credentials', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid email or password' }),
      } as Response)

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'wrong@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid email or password')).toBeInTheDocument()
      })
    })

    it('should show generic error when API returns no error message', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response)

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'password123')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument()
      })
    })

    it('should NOT redirect on failed login', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      } as Response)

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })

    it('should show error on network failure', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'))

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'password123')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('should show "Signing in..." while submitting', async () => {
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as Response), 100))
      )

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'password123')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      expect(screen.getByText('Signing in...')).toBeInTheDocument()
    })

    it('should disable submit button while loading', async () => {
      vi.mocked(global.fetch).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        } as Response), 100))
      )

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'password123')

      const submitButton = screen.getByRole('button', { name: /sign in/i })
      fireEvent.click(submitButton)

      expect(submitButton).toBeDisabled()
    })

    it('should re-enable button after failed login', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      } as Response)

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should clear previous error when submitting again', async () => {
      // First submission fails
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      } as Response)

      render(<LoginPage />)

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com')
      await userEvent.type(screen.getByLabelText(/password/i), 'wrongpassword')

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
      })

      // Second submission (error should be cleared during submit)
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      } as Response)

      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      // During loading, the error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Invalid credentials')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have autocomplete attribute on email input', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
    })

    it('should have autocomplete attribute on password input', () => {
      render(<LoginPage />)

      const passwordInput = screen.getByLabelText(/password/i)
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
    })

    it('should have associated labels for inputs', () => {
      render(<LoginPage />)

      const emailInput = screen.getByLabelText(/email/i)
      const passwordInput = screen.getByLabelText(/password/i)

      expect(emailInput).toHaveAttribute('id', 'email')
      expect(passwordInput).toHaveAttribute('id', 'password')
    })
  })
})
