/**
 * API tests for health endpoint
 * @file __tests__/api/health.test.ts
 */

import { GET } from '@/app/api/health/route'

// Mock Prisma client
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

import { prisma } from '@/lib/prisma'

describe('Health Check API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return healthy status when database is connected', async () => {
    // Mock successful database query
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.checks.database).toBe('healthy')
    expect(data.checks.memory).toBe('healthy')
    expect(data.timestamp).toBeDefined()
    expect(data.uptime).toBeDefined()
  })

  it('should return degraded status when database is disconnected', async () => {
    // Mock database connection failure
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('degraded')
    expect(data.checks.database).toBe('unhealthy')
  })

  it('should include environment information', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(data.environment).toBeDefined()
    expect(data.version).toBeDefined()
  })
})
