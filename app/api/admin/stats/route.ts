import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/admin/stats - Get admin dashboard statistics
export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 30)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Parallel fetch all stats
    const [
      // Form templates
      activeFormTemplates,
      formTemplatesThisMonth,

      // Submissions
      totalSubmissions,
      submissionsThisWeek,

      // Users
      activeUsers,
      usersOnlineRecently,

      // Pending reviews
      pendingReviews,
      urgentReviews,

      // Programs
      activePrograms,

      // Shifts
      activeShifts,

      // Rinks
      activeRinks
    ] = await Promise.all([
      // Active form templates
      prisma.formTemplate.count({
        where: { facilityId: user.facilityId, isActive: true }
      }),

      // Form templates created this month
      prisma.formTemplate.count({
        where: {
          facilityId: user.facilityId,
          createdAt: { gte: monthAgo }
        }
      }),

      // Total submissions
      prisma.submission.count({
        where: { rink: { facilityId: user.facilityId } }
      }),

      // Submissions this week
      prisma.submission.count({
        where: {
          rink: { facilityId: user.facilityId },
          submittedAt: { gte: weekAgo }
        }
      }),

      // Active users
      prisma.user.count({
        where: { facilityId: user.facilityId, isActive: true }
      }),

      // Users logged in within last 24 hours
      prisma.user.count({
        where: {
          facilityId: user.facilityId,
          isActive: true,
          lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      }),

      // Pending reviews (incidents, etc.)
      prisma.submission.count({
        where: {
          rink: { facilityId: user.facilityId },
          status: 'PENDING_REVIEW'
        }
      }),

      // Urgent reviews (ambulance called incidents)
      prisma.submission.count({
        where: {
          rink: { facilityId: user.facilityId },
          status: 'PENDING_REVIEW',
          formTemplate: { moduleType: 'INCIDENT' }
        }
      }),

      // Active programs
      prisma.program.count({
        where: { facilityId: user.facilityId, isActive: true }
      }),

      // Active shift definitions
      prisma.shiftDefinition.count({
        where: { facilityId: user.facilityId, isActive: true }
      }),

      // Active rinks
      prisma.rink.count({
        where: { facilityId: user.facilityId, isActive: true }
      })
    ])

    // Get recent activity
    const recentActivity = await prisma.submission.findMany({
      where: {
        rink: { facilityId: user.facilityId }
      },
      include: {
        submittedBy: {
          select: { firstName: true, lastName: true }
        },
        formTemplate: {
          select: { name: true, moduleType: true }
        },
        rink: {
          select: { name: true }
        }
      },
      orderBy: { submittedAt: 'desc' },
      take: 10
    })

    const activity = recentActivity.map((sub: typeof recentActivity[number]) => ({
      id: sub.id,
      type: sub.formTemplate.moduleType,
      title: sub.formTemplate.name,
      user: `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}`,
      rink: sub.rink.name,
      status: sub.status,
      timestamp: sub.submittedAt
    }))

    return NextResponse.json({
      forms: {
        active: activeFormTemplates,
        newThisMonth: formTemplatesThisMonth
      },
      submissions: {
        total: totalSubmissions,
        thisWeek: submissionsThisWeek
      },
      users: {
        active: activeUsers,
        onlineRecently: usersOnlineRecently
      },
      reviews: {
        pending: pendingReviews,
        urgent: urgentReviews
      },
      programs: {
        active: activePrograms
      },
      shifts: {
        active: activeShifts
      },
      rinks: {
        active: activeRinks
      },
      activity
    })
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}
