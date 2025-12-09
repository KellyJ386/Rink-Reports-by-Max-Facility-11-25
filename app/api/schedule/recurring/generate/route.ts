import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// POST /api/schedule/recurring/generate - Generate schedule entries from patterns
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
    const { patternId, startDate, endDate, overwriteExisting } = body

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Limit generation to 12 weeks max
    const maxDays = 84
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > maxDays) {
      return NextResponse.json(
        { error: `Cannot generate more than ${maxDays} days at once` },
        { status: 400 }
      )
    }

    // Get patterns to generate from
    let patterns
    if (patternId) {
      patterns = await prisma.recurringShiftPattern.findMany({
        where: {
          id: patternId,
          facilityId: user.facilityId,
          isActive: true,
        },
        include: { assignments: true },
      })
    } else {
      // Get all active patterns for facility
      patterns = await prisma.recurringShiftPattern.findMany({
        where: {
          facilityId: user.facilityId,
          isActive: true,
          OR: [
            { startDate: null },
            { startDate: { lte: end } },
          ],
          AND: [
            {
              OR: [
                { endDate: null },
                { endDate: { gte: start } },
              ],
            },
          ],
        },
        include: { assignments: true },
      })
    }

    if (patterns.length === 0) {
      return NextResponse.json(
        { error: 'No active patterns found' },
        { status: 404 }
      )
    }

    // If overwriting, delete existing draft entries in range
    if (overwriteExisting) {
      await prisma.scheduleEntry.deleteMany({
        where: {
          user: { facilityId: user.facilityId },
          date: { gte: start, lte: end },
          status: 'DRAFT',
        },
      })
    }

    // Generate entries
    const entriesToCreate: any[] = []
    const currentDate = new Date(start)

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay()

      for (const pattern of patterns) {
        const patternDays = pattern.daysOfWeek as number[]

        if (!patternDays.includes(dayOfWeek)) continue

        // Check pattern date range
        if (pattern.startDate && currentDate < pattern.startDate) continue
        if (pattern.endDate && currentDate > pattern.endDate) continue

        // Get assignments for this day
        const dayAssignments = pattern.assignments.filter(a => a.dayOfWeek === dayOfWeek)

        if (dayAssignments.length > 0) {
          // Create entry for each assigned user
          for (const assignment of dayAssignments) {
            entriesToCreate.push({
              userId: assignment.userId,
              shiftId: pattern.shiftId,
              rinkId: pattern.rinkId,
              date: new Date(currentDate),
              startTime: pattern.startTime,
              endTime: pattern.endTime,
              isOpenShift: false,
              isEmergency: false,
              status: 'DRAFT',
              createdById: user.id,
            })
          }
        } else {
          // Create as open shift if no assignments
          entriesToCreate.push({
            userId: user.id, // Placeholder
            shiftId: pattern.shiftId,
            rinkId: pattern.rinkId,
            date: new Date(currentDate),
            startTime: pattern.startTime,
            endTime: pattern.endTime,
            isOpenShift: true,
            isEmergency: false,
            status: 'DRAFT',
            createdById: user.id,
          })
        }
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Batch create entries
    if (entriesToCreate.length > 0) {
      await prisma.scheduleEntry.createMany({
        data: entriesToCreate,
        skipDuplicates: true,
      })
    }

    return NextResponse.json({
      message: `Generated ${entriesToCreate.length} schedule entries`,
      count: entriesToCreate.length,
    })
  } catch (error) {
    console.error('Generate schedule error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
