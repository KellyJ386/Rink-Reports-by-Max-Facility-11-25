import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: HealthCheck
    memory: HealthCheck
  }
}

interface HealthCheck {
  status: 'pass' | 'fail'
  responseTime?: number
  message?: string
}

const startTime = Date.now()

export async function GET() {
  const timestamp = new Date().toISOString()
  const uptime = Math.floor((Date.now() - startTime) / 1000)

  const checks: HealthStatus['checks'] = {
    database: { status: 'fail' },
    memory: { status: 'fail' },
  }

  // Check database connection
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = {
      status: 'pass',
      responseTime: Date.now() - dbStart,
    }
  } catch (error) {
    checks.database = {
      status: 'fail',
      message: error instanceof Error ? error.message : 'Database connection failed',
    }
  }

  // Check memory usage
  try {
    const memUsage = process.memoryUsage()
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024)
    const usagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

    checks.memory = {
      status: usagePercent < 90 ? 'pass' : 'fail',
      message: `${heapUsedMB}MB / ${heapTotalMB}MB (${usagePercent.toFixed(1)}%)`,
    }
  } catch (error) {
    checks.memory = {
      status: 'fail',
      message: 'Unable to get memory info',
    }
  }

  // Determine overall status
  const allPassing = Object.values(checks).every((c) => c.status === 'pass')
  const allFailing = Object.values(checks).every((c) => c.status === 'fail')

  let overallStatus: HealthStatus['status']
  if (allPassing) {
    overallStatus = 'healthy'
  } else if (allFailing) {
    overallStatus = 'unhealthy'
  } else {
    overallStatus = 'degraded'
  }

  const health: HealthStatus = {
    status: overallStatus,
    timestamp,
    version: process.env.npm_package_version || '1.0.0',
    uptime,
    checks,
  }

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503

  return NextResponse.json(health, { status: statusCode })
}
