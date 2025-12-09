import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// POST /api/schedule/[id]/claim - Claim an open shift
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const entry = await prisma.scheduleEntry.findFirst({
      where: {
        id,
        user: {
          facilityId: user.facilityId,
        },
      },
    })

    if (!entry) {
      return NextResponse.json(
        { error: 'Schedule entry not found' },
        { status: 404 }
      )
    }

    // Verify this is an open shift that can be claimed
    if (!entry.isOpenShift) {
      return NextResponse.json(
        { error: 'This shift is not open for claiming' },
        { status: 400 }
      )
    }

    if (entry.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'This shift is not yet published' },
        { status: 400 }
      )
    }

    // Check if shift is already filled
    if (entry.status === 'FILLED') {
      return NextResponse.json(
        { error: 'This shift has already been filled' },
        { status: 400 }
      )
    }

    // Check for schedule conflicts
    const conflictingEntry = await prisma.scheduleEntry.findFirst({
      where: {
        userId: user.id,
        date: entry.date,
        id: { not: entry.id },
        OR: [
          {
            // Overlapping times
            AND: [
              { startTime: { lte: entry.endTime } },
              { endTime: { gte: entry.startTime } },
            ],
          },
        ],
      },
    })

    if (conflictingEntry) {
      return NextResponse.json(
        { error: 'You already have a shift scheduled during this time' },
        { status: 400 }
      )
    }

    // Claim the shift
    const updatedEntry = await prisma.scheduleEntry.update({
      where: { id },
      data: {
        userId: user.id,
        isOpenShift: false,
        status: 'FILLED',
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
      },
    })

    return NextResponse.json(updatedEntry)
  } catch (error) {
    console.error('Error claiming shift:', error)
    return NextResponse.json(
      { error: 'Failed to claim shift' },
      { status: 500 }
    )
  }
}
