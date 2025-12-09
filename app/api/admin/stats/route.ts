import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAccess } from '@/lib/adminAuth'

export async function GET() {
  try {
    const user = await requireAdminAccess()

    // Get stats for the user's facility
    const [
      totalUsers,
      activeUsers,
      totalRoles,
      totalForms,
      recentActivity,
    ] = await Promise.all([
      prisma.user.count({
        where: { facilityId: user.facilityId },
      }),
      prisma.user.count({
        where: { facilityId: user.facilityId, isActive: true },
      }),
      prisma.role.count({
        where: {
          OR: [
            { facilityId: user.facilityId },
            { isSystemDefault: true },
          ],
        },
      }),
      prisma.formTemplate.count({
        where: { facilityId: user.facilityId },
      }),
      prisma.auditLog.findMany({
        where: {
          user: { facilityId: user.facilityId },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ])

    return NextResponse.json({
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalRoles,
      totalForms,
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: error.message },
          { status: error.message.includes('Unauthorized') ? 401 : 403 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}
