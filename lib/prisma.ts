import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch {
    // During build without database, return a proxy that throws helpful errors
    console.warn('Prisma client not initialized. Run "npx prisma generate" and ensure DATABASE_URL is set.')

    return new Proxy({} as PrismaClient, {
      get(_target, prop) {
        if (prop === 'then') return undefined // Prevent promise resolution issues
        throw new Error(
          `Prisma client not initialized. Please run "npx prisma generate" and ensure DATABASE_URL is configured.`
        )
      },
    })
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
