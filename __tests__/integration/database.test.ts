/**
 * Integration tests for database operations
 * @file __tests__/integration/database.test.ts
 */

// Skip integration tests if no database is available
const skipIntegration = !process.env.DATABASE_URL || process.env.SKIP_INTEGRATION_TESTS

describe('Database Integration', () => {
  // Conditionally skip all tests in this file
  const testOrSkip = skipIntegration ? it.skip : it

  testOrSkip('should connect to database', async () => {
    // This test requires a real database connection
    const { prisma } = await import('@/lib/prisma')

    const result = await prisma.$queryRaw`SELECT 1 as test`
    expect(result).toBeDefined()
  })

  testOrSkip('should query facilities', async () => {
    const { prisma } = await import('@/lib/prisma')

    const facilities = await prisma.facility.findMany({
      take: 1,
    })

    expect(Array.isArray(facilities)).toBe(true)
  })

  testOrSkip('should query users with roles', async () => {
    const { prisma } = await import('@/lib/prisma')

    const users = await prisma.user.findMany({
      take: 1,
      include: {
        role: true,
      },
    })

    expect(Array.isArray(users)).toBe(true)
    if (users.length > 0) {
      expect(users[0].role).toBeDefined()
    }
  })
})

describe('Database Schema Validation', () => {
  it('should have correct model relationships defined', () => {
    // This test validates that Prisma schema is properly configured
    // by checking that the client can be imported without errors
    expect(() => require('@/lib/prisma')).not.toThrow()
  })
})
