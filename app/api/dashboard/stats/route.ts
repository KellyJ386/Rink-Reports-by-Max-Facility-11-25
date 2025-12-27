import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    // Parallel fetch all stats
    const [
      // User stats
      activeUsers,
      totalUsers,

      // Schedule stats (if user has access)
      todayShifts,
      openShifts,
      myUpcomingShifts,

      // Ice depth stats (if user has access)
      recentIceReadings,
      rinksNeedingAttention,

      // Notification stats
      unreadNotifications,

      // Recent activity
      recentSubmissions,

      // Rink count
      activeRinks
    ] = await Promise.all([
      // Active users in facility
      prisma.user.count({
        where: { facilityId: user.facilityId, isActive: true }
      }),

      // Total users
      prisma.user.count({
        where: { facilityId: user.facilityId }
      }),

      // Today's scheduled shifts
      permissions.schedule?.access
        ? prisma.scheduleEntry.count({
            where: {
              facilityId: user.facilityId,
              date: {
                gte: today,
                lt: tomorrow
              }
            }
          })
        : Promise.resolve(0),

      // Open shifts needing coverage
      permissions.schedule?.access
        ? prisma.scheduleEntry.count({
            where: {
              facilityId: user.facilityId,
              isOpenShift: true,
              date: { gte: today }
            }
          })
        : Promise.resolve(0),

      // User's upcoming shifts
      permissions.schedule?.access
        ? prisma.scheduleEntry.count({
            where: {
              userId: user.id,
              date: { gte: today }
            }
          })
        : Promise.resolve(0),

      // Ice depth readings this week
      permissions.iceDepth?.access
        ? prisma.iceDepthReading.count({
            where: {
              rink: { facilityId: user.facilityId },
              recordedAt: { gte: weekAgo }
            }
          })
        : Promise.resolve(0),

      // Rinks with issues (below target depth)
      permissions.iceDepth?.access
        ? prisma.iceDepthReading.count({
            where: {
              rink: { facilityId: user.facilityId },
              recordedAt: { gte: weekAgo },
              hasIssues: true
            }
          })
        : Promise.resolve(0),

      // Unread notifications
      prisma.notification.count({
        where: {
          OR: [
            { recipientUserId: user.id },
            { recipientRoleId: user.roleId }
          ],
          isRead: false
        }
      }),

      // Recent submissions (last 7 days)
      prisma.submission.findMany({
        where: {
          facilityId: user.facilityId,
          submittedAt: { gte: weekAgo }
        },
        include: {
          submittedBy: {
            select: { firstName: true, lastName: true }
          },
          formTemplate: {
            select: { name: true, moduleType: true }
          }
        },
        orderBy: { submittedAt: 'desc' },
        take: 10
      }),

      // Active rinks
      prisma.rink.count({
        where: { facilityId: user.facilityId, isActive: true }
      })
    ])

    // Get today's schedule summary
    let scheduleToday = null
    if (permissions.schedule?.access) {
      const todayEntries = await prisma.scheduleEntry.findMany({
        where: {
          facilityId: user.facilityId,
          date: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          assignedUser: {
            select: { firstName: true, lastName: true }
          },
          shift: {
            select: { name: true, startTime: true, endTime: true }
          }
        },
        orderBy: { shift: { startTime: 'asc' } }
      })

      const filledShifts = todayEntries.filter((e: typeof todayEntries[number]) => e.userId && !e.isOpenShift).length
      const openCount = todayEntries.filter((e: typeof todayEntries[number]) => e.isOpenShift).length

      scheduleToday = {
        total: todayEntries.length,
        filled: filledShifts,
        open: openCount,
        coverage: todayEntries.length > 0
          ? Math.round((filledShifts / todayEntries.length) * 100)
          : 100
      }
    }

    // Get latest ice depth reading per rink
    let iceDepthSummary = null
    if (permissions.iceDepth?.access) {
      const rinks = await prisma.rink.findMany({
        where: { facilityId: user.facilityId, isActive: true },
        include: {
          iceDepthReadings: {
            orderBy: { recordedAt: 'desc' },
            take: 1,
            select: {
              id: true,
              averageDepth: true,
              targetDepth: true,
              hasIssues: true,
              recordedAt: true
            }
          }
        }
      })

      iceDepthSummary = rinks.map((rink: typeof rinks[number]) => ({
        rinkId: rink.id,
        rinkName: rink.name,
        lastReading: rink.iceDepthReadings[0] || null
      }))
    }

    // Format recent activity
    const activity = recentSubmissions.map((sub: typeof recentSubmissions[number]) => ({
      id: sub.id,
      type: 'submission',
      title: sub.formTemplate?.name || 'Form Submission',
      module: sub.formTemplate?.moduleType || 'unknown',
      user: `${sub.submittedBy.firstName} ${sub.submittedBy.lastName}`,
      timestamp: sub.submittedAt
    }))

    return NextResponse.json({
      users: {
        active: activeUsers,
        total: totalUsers
      },
      schedule: scheduleToday
        ? {
            todayShifts,
            openShifts,
            myUpcomingShifts,
            todayCoverage: scheduleToday.coverage,
            ...scheduleToday
          }
        : null,
      iceDepth: permissions.iceDepth?.access
        ? {
            readingsThisWeek: recentIceReadings,
            rinksWithIssues: rinksNeedingAttention,
            summary: iceDepthSummary
          }
        : null,
      notifications: {
        unread: unreadNotifications
      },
      facility: {
        rinks: activeRinks
      },
      activity
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
