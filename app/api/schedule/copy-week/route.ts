import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// POST /api/schedule/copy-week - Copy a week of schedules to another week
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { sourceWeekStart, targetWeekStart, overwriteExisting } = body

    if (!sourceWeekStart || !targetWeekStart) {
      return NextResponse.json(
        { error: 'Source and target week start dates are required' },
        { status: 400 }
      )
    }

    const sourceStart = new Date(sourceWeekStart)
    const sourceEnd = new Date(sourceStart)
    sourceEnd.setDate(sourceEnd.getDate() + 6)

    const targetStart = new Date(targetWeekStart)

    // Get source week entries
    const sourceEntries = await prisma.scheduleEntry.findMany({
      where: {
        user: { facilityId: user.facilityId },
        date: { gte: sourceStart, lte: sourceEnd },
        status: { not: 'CANCELLED' },
      },
    })

    if (sourceEntries.length === 0) {
      return NextResponse.json(
        { error: 'No schedule entries found in source week' },
        { status: 404 }
      )
    }

    // Calculate day offset
    const targetEnd = new Date(targetStart)
    targetEnd.setDate(targetEnd.getDate() + 6)

    // Delete existing drafts if requested
    if (overwriteExisting) {
      await prisma.scheduleEntry.deleteMany({
        where: {
          user: { facilityId: user.facilityId },
          date: { gte: targetStart, lte: targetEnd },
          status: 'DRAFT',
        },
      })
    }

    // Create new entries with shifted dates
    const entriesToCreate = sourceEntries.map(entry => {
      const entryDate = new Date(entry.date)
      const dayOfWeek = entryDate.getDay()
      const targetDate = new Date(targetStart)
      targetDate.setDate(targetDate.getDate() + dayOfWeek)

      return {
        userId: entry.userId,
        shiftId: entry.shiftId,
        rinkId: entry.rinkId,
        date: targetDate,
        startTime: entry.startTime,
        endTime: entry.endTime,
        isOpenShift: entry.isOpenShift,
        isEmergency: false, // Don't copy emergency status
        status: 'DRAFT' as const,
        createdById: user.id,
      }
    })

    await prisma.scheduleEntry.createMany({
      data: entriesToCreate,
    })

    return NextResponse.json({
      message: `Copied ${entriesToCreate.length} entries to target week`,
      count: entriesToCreate.length,
    })
  } catch (error) {
    console.error('Copy week error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
