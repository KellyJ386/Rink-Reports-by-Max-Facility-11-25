import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock Prisma client
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

// Set default environment variables for tests
process.env.JWT_SECRET = 'test-secret-key-for-testing'
process.env.JWT_EXPIRES_IN = '7d'
process.env.NODE_ENV = 'test'
