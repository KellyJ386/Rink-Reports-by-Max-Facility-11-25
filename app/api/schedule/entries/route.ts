import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import {
  validateScheduleEntry,
  detectConflicts,
  getScheduleEntries,
  getScheduleStats
} from '@/lib/schedule'

// GET /api/schedule/entries - List schedule entries with filters
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const userId = searchParams.get('userId')
    const rinkId = searchParams.get('rinkId')
    const shiftId = searchParams.get('shiftId')
    const status = searchParams.get('status')
    const isOpenShift = searchParams.get('openShifts')
    const isEmergency = searchParams.get('emergency')
    const statsOnly = searchParams.get('stats') === 'true'

    // Build filters
    const filters: any = {
      facilityId: user.facilityId
    }

    // If user can only view own schedules, restrict userId
    if (!permissions.schedule?.viewAll && permissions.schedule?.viewOwn) {
      filters.userId = user.id
    } else if (userId) {
      filters.userId = userId
    }

    if (rinkId) filters.rinkId = rinkId
    if (shiftId) filters.shiftId = shiftId
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    if (status) filters.status = status.split(',')
    if (isOpenShift === 'true') filters.isOpenShift = true
    if (isEmergency === 'true') filters.isEmergency = true

    // Return stats if requested
    if (statsOnly && startDate && endDate) {
      const stats = await getScheduleStats(user.facilityId, startDate, endDate)
      return NextResponse.json(stats)
    }

    const entries = await getScheduleEntries(filters)
    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching schedule entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule entries' },
      { status: 500 }
    )
  }
}

// POST /api/schedule/entries - Create a new schedule entry
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.create) {
      return NextResponse.json(
        { error: 'You do not have permission to create schedule entries' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      userId,
      shiftId,
      rinkId,
      date,
      startTime,
      endTime,
      isOpenShift,
      isEmergency,
      notes
    } = body

    // Validate entry
    const validation = validateScheduleEntry({
      date,
      startTime,
      endTime,
      userId
    })

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check for conflicts if assigning to a user
    if (userId) {
      const conflicts = await detectConflicts(
        user.facilityId,
        userId,
        date,
        startTime,
        endTime
      )

      if (conflicts.length > 0) {
        return NextResponse.json(
          {
            error: 'Scheduling conflict detected',
            conflicts
          },
          { status: 400 }
        )
      }
    }

    // If shiftId provided, verify it exists and get times
    let shiftData = null
    if (shiftId) {
      shiftData = await prisma.shiftDefinition.findUnique({
        where: { id: shiftId }
      })

      if (!shiftData || shiftData.facilityId !== user.facilityId) {
        return NextResponse.json(
          { error: 'Invalid shift definition' },
          { status: 400 }
        )
      }
    }

    // If rinkId provided, verify it exists
    if (rinkId) {
      const rink = await prisma.rink.findUnique({
        where: { id: rinkId }
      })

      if (!rink || rink.facilityId !== user.facilityId) {
        return NextResponse.json(
          { error: 'Invalid rink' },
          { status: 400 }
        )
      }
    }

    const entry = await prisma.scheduleEntry.create({
      data: {
        facilityId: user.facilityId,
        userId: userId || null,
        shiftId: shiftId || null,
        rinkId: rinkId || null,
        date: new Date(date),
        startTime: shiftData?.startTime || startTime,
        endTime: shiftData?.endTime || endTime,
        isOpenShift: isOpenShift || !userId,
        isEmergency: isEmergency || false,
        status: 'DRAFT',
        notes: notes || null,
        createdById: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        shift: true,
        rink: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule entry' },
      { status: 500 }
    )
  }
}
