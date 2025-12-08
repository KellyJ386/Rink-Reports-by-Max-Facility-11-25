import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { updateSchedulePeriodSchema, publishSchedulePeriodSchema } from '@/types/schedule'
import { SchedulePeriodStatus, ScheduleStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/schedule/periods/[id] - Get single period with entries
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const period = await prisma.schedulePeriod.findUnique({
      where: { id },
    })

    if (!period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 })
    }

    if (period.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get entries for this period
    const entries = await prisma.scheduleEntry.findMany({
      where: {
        facilityId: user.facilityId,
        date: {
          gte: period.startDate,
          lte: period.endDate,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: { select: { name: true } },
          },
        },
        shift: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    // Calculate stats
    const stats = {
      totalShifts: entries.length,
      filledShifts: entries.filter((e) => e.userId && !e.isOpenShift).length,
      openShifts: entries.filter((e) => e.isOpenShift || !e.userId).length,
      conflictsCount: entries.filter((e) => e.hasConflict).length,
    }

    return NextResponse.json({ period, entries, stats })
  } catch (error) {
    console.error('Error fetching period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/schedule/periods/[id] - Update period or publish
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const period = await prisma.schedulePeriod.findUnique({
      where: { id },
    })

    if (!period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 })
    }

    if (period.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Handle publish action
    if (body.action === 'publish') {
      if (!canUserAccess(user, 'schedule', 'publish')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      if (period.status === SchedulePeriodStatus.PUBLISHED) {
        return NextResponse.json({ error: 'Period is already published' }, { status: 400 })
      }

      const result = publishSchedulePeriodSchema.safeParse(body.options || {})
      if (!result.success) {
        return NextResponse.json({ error: result.error.errors }, { status: 400 })
      }

      const options = result.data

      // Update all entries to published status
      await prisma.$transaction(async (tx) => {
        // Update period status
        await tx.schedulePeriod.update({
          where: { id },
          data: {
            status: SchedulePeriodStatus.PUBLISHED,
            publishedAt: new Date(),
            publishedById: user.id,
          },
        })

        // Update all draft entries in this period
        await tx.scheduleEntry.updateMany({
          where: {
            facilityId: user.facilityId,
            date: {
              gte: period.startDate,
              lte: period.endDate,
            },
            status: ScheduleStatus.DRAFT,
          },
          data: {
            status: ScheduleStatus.PUBLISHED,
            publishedAt: new Date(),
            publishedById: user.id,
          },
        })
      })

      // Send notifications if requested
      if (options.notifyEmployees) {
        // Get all employees with entries in this period
        const entries = await prisma.scheduleEntry.findMany({
          where: {
            facilityId: user.facilityId,
            date: {
              gte: period.startDate,
              lte: period.endDate,
            },
            userId: { not: null },
          },
          select: {
            userId: true,
          },
          distinct: ['userId'],
        })

        const employeeIds = entries.map((e) => e.userId).filter(Boolean) as string[]

        for (const employeeId of employeeIds) {
          await prisma.notification.create({
            data: {
              facilityId: user.facilityId,
              recipientUserId: employeeId,
              type: 'SCHEDULE_PUBLISHED',
              title: 'Schedule Published',
              message: `The schedule for ${period.name} has been published. Please check your shifts.`,
              relatedEntityType: 'SchedulePeriod',
              relatedEntityId: id,
              emailSent: options.sendEmail,
            },
          })
        }

        // Create general notification for open shifts
        const openShifts = await prisma.scheduleEntry.count({
          where: {
            facilityId: user.facilityId,
            date: {
              gte: period.startDate,
              lte: period.endDate,
            },
            isOpenShift: true,
          },
        })

        if (openShifts > 0) {
          await prisma.notification.create({
            data: {
              facilityId: user.facilityId,
              type: 'SHIFT_OPEN',
              title: 'Open Shifts Available',
              message: `There are ${openShifts} open shifts available for ${period.name}.`,
              relatedEntityType: 'SchedulePeriod',
              relatedEntityId: id,
            },
          })
        }
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'PUBLISH',
          entityType: 'SchedulePeriod',
          entityId: id,
          previousValue: period,
          newValue: { published: true, options },
        },
      })

      const updatedPeriod = await prisma.schedulePeriod.findUnique({
        where: { id },
      })

      return NextResponse.json({ period: updatedPeriod, message: 'Schedule published successfully' })
    }

    // Handle lock action
    if (body.action === 'lock') {
      if (!canUserAccess(user, 'schedule', 'edit')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const updatedPeriod = await prisma.schedulePeriod.update({
        where: { id },
        data: {
          isLocked: true,
          lockedAt: new Date(),
          lockedById: user.id,
        },
      })

      return NextResponse.json({ period: updatedPeriod })
    }

    // Handle unlock action
    if (body.action === 'unlock') {
      if (!canUserAccess(user, 'schedule', 'edit')) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      const updatedPeriod = await prisma.schedulePeriod.update({
        where: { id },
        data: {
          isLocked: false,
          lockedAt: null,
          lockedById: null,
        },
      })

      return NextResponse.json({ period: updatedPeriod })
    }

    // Regular update
    if (!canUserAccess(user, 'schedule', 'edit')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (period.isLocked) {
      return NextResponse.json({ error: 'Period is locked' }, { status: 400 })
    }

    const result = updateSchedulePeriodSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const data = result.data
    const updateData: any = { ...data }

    if (data.startDate) updateData.startDate = new Date(data.startDate)
    if (data.endDate) updateData.endDate = new Date(data.endDate)

    const updatedPeriod = await prisma.schedulePeriod.update({
      where: { id },
      data: updateData,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'SchedulePeriod',
        entityId: id,
        previousValue: period,
        newValue: updatedPeriod,
      },
    })

    return NextResponse.json({ period: updatedPeriod })
  } catch (error) {
    console.error('Error updating period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/schedule/periods/[id] - Delete period
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'delete')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const period = await prisma.schedulePeriod.findUnique({
      where: { id },
    })

    if (!period) {
      return NextResponse.json({ error: 'Period not found' }, { status: 404 })
    }

    if (period.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (period.status === SchedulePeriodStatus.PUBLISHED) {
      return NextResponse.json({
        error: 'Cannot delete published periods. Archive instead.',
      }, { status: 400 })
    }

    await prisma.schedulePeriod.delete({
      where: { id },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'SchedulePeriod',
        entityId: id,
        previousValue: period,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting period:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
