import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// POST /api/schedule/templates/[id]/apply - Apply a template to a week
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { targetWeekStart, overwriteExisting } = body

    if (!targetWeekStart) {
      return NextResponse.json(
        { error: 'Target week start date is required' },
        { status: 400 }
      )
    }

    // Get template
    const template = await prisma.scheduleTemplate.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
        isActive: true,
      },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const weekStart = new Date(targetWeekStart)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    // Delete existing drafts if requested
    if (overwriteExisting) {
      await prisma.scheduleEntry.deleteMany({
        where: {
          user: { facilityId: user.facilityId },
          date: { gte: weekStart, lte: weekEnd },
          status: 'DRAFT',
        },
      })
    }

    // Create entries from template
    const weekData = template.weekData as any[]
    const entriesToCreate: any[] = []

    for (const entry of weekData) {
      const entryDate = new Date(weekStart)
      entryDate.setDate(entryDate.getDate() + entry.dayOfWeek)

      entriesToCreate.push({
        userId: entry.userId,
        shiftId: entry.shiftId,
        rinkId: entry.rinkId,
        date: entryDate,
        startTime: entry.startTime,
        endTime: entry.endTime,
        isOpenShift: entry.isOpenShift,
        isEmergency: false,
        status: 'DRAFT',
        createdById: user.id,
      })
    }

    if (entriesToCreate.length > 0) {
      await prisma.scheduleEntry.createMany({
        data: entriesToCreate,
      })
    }

    return NextResponse.json({
      message: `Applied template with ${entriesToCreate.length} entries`,
      count: entriesToCreate.length,
    })
  } catch (error) {
    console.error('Apply template error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
