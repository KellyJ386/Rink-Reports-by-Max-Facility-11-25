import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/shifts - List all shift definitions for the facility
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const shifts = await prisma.shiftDefinition.findMany({
      where: {
        facilityId: user.facilityId,
        isActive: true,
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

// POST /api/shifts - Create a new shift definition
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'create')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, startTime, endTime, color, rinkId } = body

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Name, start time, and end time are required' },
        { status: 400 }
      )
    }

    const shift = await prisma.shiftDefinition.create({
      data: {
        facilityId: user.facilityId,
        name,
        startTime,
        endTime,
        color: color || '#3B82F6',
        rinkId: rinkId || null,
      },
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    )
  }
}
