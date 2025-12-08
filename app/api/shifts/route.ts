import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserPermissions, canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/shifts - List all shift definitions for the facility
export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const shifts = await prisma.shiftDefinition.findMany({
      where: {
        facilityId: user.facilityId,
      },
      orderBy: [
        { startTime: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Get shifts error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/shifts - Create a new shift definition
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
    const { name, startTime, endTime, rinkId, color } = body

    // Validation
    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Name, start time, and end time are required' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM (24-hour format)' },
        { status: 400 }
      )
    }

    // If rinkId provided, verify it belongs to the facility
    if (rinkId) {
      const rink = await prisma.rink.findFirst({
        where: {
          id: rinkId,
          facilityId: user.facilityId,
        },
      })

      if (!rink) {
        return NextResponse.json(
          { error: 'Invalid rink' },
          { status: 400 }
        )
      }
    }

    const shift = await prisma.shiftDefinition.create({
      data: {
        facilityId: user.facilityId,
        name,
        startTime,
        endTime,
        rinkId: rinkId || null,
        color: color || null,
        isActive: true,
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    console.error('Create shift error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
