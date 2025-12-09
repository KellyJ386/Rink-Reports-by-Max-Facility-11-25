import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing'
process.env.JWT_EXPIRES_IN = '1h'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'

// Mock next/headers
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
      create: vi.fn(),
      delete: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    facility: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    rink: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    submission: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}))

// Global test utilities
declare global {
  var testUtils: {
    createMockUser: typeof createMockUser
    createMockRole: typeof createMockRole
    createMockFacility: typeof createMockFacility
  }
}

function createMockFacility(overrides = {}) {
  return {
    id: 'facility-1',
    name: 'Test Facility',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    country: 'USA',
    timezone: 'America/Chicago',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createMockRole(overrides = {}) {
  return {
    id: 'role-1',
    name: 'Operator',
    description: 'Standard operator role',
    permissions: {
      admin: { access: false },
      iceDepth: { access: true, submit: true, viewOwn: true, viewAll: false },
      iceOperations: { access: true, submit: true, viewOwn: true, viewAll: false },
      refrigeration: { access: true, submit: true, viewOwn: true, viewAll: false },
      airQuality: { access: true, submit: true, viewOwn: true, viewAll: false },
      incidents: { access: true, submit: true, viewOwn: true, viewAll: false },
      schedule: { access: true, viewOwn: true, viewAll: false },
      dailyChecklist: { access: true, submit: true, viewOwn: true, viewAll: false },
    },
    isSystemDefault: false,
    facilityId: 'facility-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function createMockUser(overrides = {}) {
  const role = createMockRole()
  const facility = createMockFacility()

  return {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: '$2a$10$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    smsPreference: 'IMPORTANT_ONLY',
    isActive: true,
    roleId: role.id,
    facilityId: facility.id,
    permissionOverrides: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    role,
    facility,
    ...overrides,
  }
}

globalThis.testUtils = {
  createMockUser,
  createMockRole,
  createMockFacility,
}

export { createMockUser, createMockRole, createMockFacility }
