import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { updateScheduleEntrySchema } from '@/types/schedule'
import { detectConflicts } from '@/lib/schedule/conflicts'
import { ScheduleStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/schedule/entries/[id] - Get single entry
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

    const entry = await prisma.scheduleEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: { select: { id: true, name: true } },
          },
        },
        shift: true,
        swapRequests: {
          include: {
            requester: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Check facility access
    if (entry.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check view permissions
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    if (!canViewAll && entry.userId !== user.id && entry.status !== ScheduleStatus.PUBLISHED) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error fetching schedule entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/schedule/entries/[id] - Update entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'edit')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const result = updateScheduleEntrySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    // Get existing entry
    const existingEntry = await prisma.scheduleEntry.findUnique({
      where: { id },
    })

    if (!existingEntry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (existingEntry.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const data = result.data
    const updateData: any = { ...data }

    // Handle date conversion
    if (data.date) {
      updateData.date = new Date(data.date)
    }

    // Update isOpenShift based on userId
    if ('userId' in data) {
      updateData.isOpenShift = !data.userId
    }

    // Check for conflicts if user changed
    let conflicts = []
    const targetUserId = data.userId !== undefined ? data.userId : existingEntry.userId
    const targetDate = data.date ? new Date(data.date) : existingEntry.date

    if (targetUserId) {
      const existingEntries = await prisma.scheduleEntry.findMany({
        where: {
          facilityId: user.facilityId,
          userId: targetUserId,
          date: targetDate,
          status: { not: ScheduleStatus.CANCELLED },
          id: { not: id },
        },
      })

      const timeOffRequests = await prisma.timeOffRequest.findMany({
        where: {
          userId: targetUserId,
          status: 'APPROVED',
          startDate: { lte: targetDate },
          endDate: { gte: targetDate },
        },
      })

      const availability = await prisma.employeeAvailability.findMany({
        where: { userId: targetUserId },
      })

      const checkEntry = {
        ...existingEntry,
        ...updateData,
        date: targetDate,
      }

      conflicts = detectConflicts(
        [...existingEntries, checkEntry],
        timeOffRequests,
        availability,
        []
      )

      updateData.hasConflict = conflicts.length > 0
      updateData.conflictNotes = conflicts.length > 0 ? conflicts.map(c => c.message).join('; ') : null
    }

    const entry = await prisma.scheduleEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: { select: { id: true, name: true } },
          },
        },
        shift: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'ScheduleEntry',
        entityId: entry.id,
        previousValue: existingEntry,
        newValue: entry,
      },
    })

    return NextResponse.json({ entry, conflicts })
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/schedule/entries/[id] - Delete entry
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

    const entry = await prisma.scheduleEntry.findUnique({
      where: { id },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    if (entry.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if entry is published - may need special handling
    if (entry.status === ScheduleStatus.PUBLISHED && entry.userId) {
      // Notify the employee that their shift was removed
      await prisma.notification.create({
        data: {
          facilityId: user.facilityId,
          recipientUserId: entry.userId,
          type: 'SHIFT_REMOVED',
          title: 'Shift Removed',
          message: `Your shift on ${entry.date.toLocaleDateString()} has been removed.`,
          relatedEntityType: 'ScheduleEntry',
          relatedEntityId: entry.id,
        },
      })
    }

    await prisma.scheduleEntry.delete({
      where: { id },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'ScheduleEntry',
        entityId: id,
        previousValue: entry,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
