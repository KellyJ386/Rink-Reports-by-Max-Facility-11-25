import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/schedule/shifts - List shift definitions
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

// POST /api/schedule/shifts - Create a new shift definition
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, startTime, endTime, color, rinkId } = body

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startTime, endTime' },
        { status: 400 }
      )
    }

    const shift = await prisma.shiftDefinition.create({
      data: {
        facilityId: user.facilityId,
        name,
        startTime,
        endTime,
        color: color || null,
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
