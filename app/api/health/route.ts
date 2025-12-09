import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startTime = Date.now()

  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: 'unknown', responseTime: 0 },
      api: { status: 'healthy', responseTime: 0 },
      memory: 'unknown',
    },
  }

  // Database health check
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime

    healthCheck.checks.database = {
      status: dbResponseTime < 1000 ? 'healthy' : 'degraded',
      responseTime: dbResponseTime,
    }
  } catch (error) {
    healthCheck.status = 'unhealthy'
    healthCheck.checks.database = {
      status: 'unhealthy',
      responseTime: 0,
    }
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

  // API response time
  healthCheck.checks.api.responseTime = Date.now() - startTime

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503

  return NextResponse.json(healthCheck, { status: statusCode })
}
