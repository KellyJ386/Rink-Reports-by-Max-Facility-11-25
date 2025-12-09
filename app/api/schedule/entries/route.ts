import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { createScheduleEntrySchema, bulkCreateScheduleEntriesSchema } from '@/types/schedule'
import { detectConflicts } from '@/lib/schedule/conflicts'
import { ScheduleStatus } from '@prisma/client'

// GET /api/schedule/entries - Get schedule entries
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const shiftId = searchParams.get('shiftId')
    const status = searchParams.get('status') as ScheduleStatus | null
    const isOpenShift = searchParams.get('isOpenShift')

    // Build query filters
    const where: any = {
      facilityId: user.facilityId,
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else if (startDate) {
      where.date = { gte: new Date(startDate) }
    } else if (endDate) {
      where.date = { lte: new Date(endDate) }
    }

    if (userId) where.userId = userId
    if (shiftId) where.shiftId = shiftId
    if (status) where.status = status
    if (isOpenShift !== null) where.isOpenShift = isOpenShift === 'true'

    // Check view permissions
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    if (!canViewAll) {
      // Can only see own schedule and published schedules
      where.OR = [
        { userId: user.id },
        { status: ScheduleStatus.PUBLISHED },
        { isOpenShift: true },
      ]
    }

    const entries = await prisma.scheduleEntry.findMany({
      where,
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
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json({ entries })
  } catch (error) {
    console.error('Error fetching schedule entries:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedule/entries - Create schedule entry
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()

    // Check if bulk create
    if (body.entries && Array.isArray(body.entries)) {
      const result = bulkCreateScheduleEntriesSchema.safeParse(body)
      if (!result.success) {
        return NextResponse.json({ error: result.error.errors }, { status: 400 })
      }

      const entries = await prisma.$transaction(
        result.data.entries.map((entry) =>
          prisma.scheduleEntry.create({
            data: {
              ...entry,
              date: new Date(entry.date),
              facilityId: user.facilityId,
              createdById: user.id,
              isOpenShift: !entry.userId,
            },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              shift: true,
            },
          })
        )
      )

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'ScheduleEntry',
          entityId: 'bulk',
          newValue: { count: entries.length },
        },
      })

      return NextResponse.json({ entries }, { status: 201 })
    }

    // Single entry create
    const result = createScheduleEntrySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const data = result.data

    // Check for conflicts if assigning to user
    let conflicts = []
    if (data.userId) {
      const existingEntries = await prisma.scheduleEntry.findMany({
        where: {
          facilityId: user.facilityId,
          userId: data.userId,
          date: new Date(data.date),
          status: { not: ScheduleStatus.CANCELLED },
        },
      })

      const timeOffRequests = await prisma.timeOffRequest.findMany({
        where: {
          userId: data.userId,
          status: 'APPROVED',
          startDate: { lte: new Date(data.date) },
          endDate: { gte: new Date(data.date) },
        },
      })

      const availability = await prisma.employeeAvailability.findMany({
        where: { userId: data.userId },
      })

      conflicts = detectConflicts(
        [...existingEntries, { ...data, id: 'new', date: new Date(data.date) } as any],
        timeOffRequests,
        availability,
        []
      )
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        userId: data.userId || null,
        shiftId: data.shiftId || null,
        rinkId: data.rinkId || null,
        facilityId: user.facilityId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes || 0,
        notes: data.notes || null,
        isOpenShift: !data.userId,
        isEmergency: data.isEmergency || false,
        createdById: user.id,
        hasConflict: conflicts.length > 0,
        conflictNotes: conflicts.length > 0 ? conflicts.map(c => c.message).join('; ') : null,
      },
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
        action: 'CREATE',
        entityType: 'ScheduleEntry',
        entityId: entry.id,
        newValue: entry,
      },
    })

    return NextResponse.json({ entry, conflicts }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
