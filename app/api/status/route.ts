import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now()

    // Gather system statistics
    const [
      facilitiesCount,
      usersCount,
      rinksCount,
      submissionsCount,
      activeUsers,
    ] = await Promise.all([
      prisma.facility.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.rink.count({ where: { isActive: true } }),
      prisma.submission.count(),
      prisma.user.count({
        where: {
          isActive: true,
          lastLoginAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
    ])

    // Get database stats
    const dbSize = await prisma.$queryRaw<any[]>`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `

    const status = {
      application: {
        name: 'MFO Ice Rink Management',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        uptimeFormatted: formatUptime(process.uptime()),
      },
      database: {
        status: 'connected',
        size: dbSize[0]?.size || 'N/A',
        responseTime: Date.now() - startTime,
      },
      statistics: {
        facilities: facilitiesCount,
        users: usersCount,
        activeUsers7Days: activeUsers,
        rinks: rinksCount,
        totalSubmissions: submissionsCount,
      },
      features: {
        pwa: process.env.ENABLE_PWA === 'true',
        offline: process.env.ENABLE_OFFLINE === 'true',
        sms: process.env.ENABLE_SMS === 'true',
        scheduledReports: process.env.ENABLE_SCHEDULED_REPORTS === 'true',
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(status, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching status:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch system status',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)

  const parts = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)

  return parts.join(' ') || '0m'
}
