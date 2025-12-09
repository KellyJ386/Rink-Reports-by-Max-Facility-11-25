import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '0.1.0',
    checks: {
      database: 'unknown',
      memory: 'unknown',
    },
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`
    healthCheck.checks.database = 'healthy'
  } catch (error) {
    healthCheck.checks.database = 'unhealthy'
    healthCheck.status = 'degraded'
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage()
  const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
  const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)

  if (heapUsedMB / heapTotalMB > 0.9) {
    healthCheck.checks.memory = 'warning'
    if (healthCheck.status === 'healthy') {
      healthCheck.status = 'degraded'
    }
  } else {
    healthCheck.checks.memory = 'healthy'
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503

  return NextResponse.json(healthCheck, { status: statusCode })
}
