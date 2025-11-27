import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  } catch (e) {
    // During build time, Prisma might not be initialized
    // Return a proxy that will throw at runtime if actually used
    console.warn('Prisma client not initialized - this is expected during build')
    return new Proxy({} as PrismaClient, {
      get() {
        throw new Error('Prisma client is not available. Please run "prisma generate".')
      }
    })
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
