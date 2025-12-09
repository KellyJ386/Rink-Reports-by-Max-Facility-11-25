import { describe, it, expect, vi, beforeEach } from 'vitest'
import Home from '@/app/page'
import { redirect } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

describe('Home Page (Root)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should redirect to /login', () => {
    Home()

    expect(redirect).toHaveBeenCalledWith('/login')
  })

  it('should call redirect exactly once', () => {
    Home()

    expect(redirect).toHaveBeenCalledTimes(1)
  })

  it('should always redirect regardless of any conditions', () => {
    // Call multiple times to ensure consistent behavior
    Home()
    vi.clearAllMocks()
    Home()

    expect(redirect).toHaveBeenCalledWith('/login')
  })
})
