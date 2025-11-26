import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const startTime = Date.now()

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: { status: 'unknown', responseTime: 0 },
      api: { status: 'healthy', responseTime: 0 },
    },
  }

  // Database health check
  try {
    const dbStartTime = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const dbResponseTime = Date.now() - dbStartTime

    health.checks.database = {
      status: dbResponseTime < 1000 ? 'healthy' : 'degraded',
      responseTime: dbResponseTime,
    }
  } catch (error) {
    health.status = 'unhealthy'
    health.checks.database = {
      status: 'unhealthy',
      responseTime: 0,
    }
  }

  // API response time
  health.checks.api.responseTime = Date.now() - startTime

  const statusCode = health.status === 'healthy' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
