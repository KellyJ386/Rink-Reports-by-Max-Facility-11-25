import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { validateShiftDefinition } from '@/lib/schedule'

// GET /api/schedule/shifts - List all shift definitions
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
    const rinkId = searchParams.get('rinkId')
    const activeOnly = searchParams.get('active') !== 'false'

    const where: any = {
      facilityId: user.facilityId
    }

    if (rinkId) {
      where.rinkId = rinkId
    }

    if (activeOnly) {
      where.isActive = true
    }

    const shifts = await prisma.shiftDefinition.findMany({
      where,
      orderBy: [
        { startTime: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shift definitions' },
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
    if (!permissions.schedule?.create) {
      return NextResponse.json(
        { error: 'You do not have permission to create shift definitions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, startTime, endTime, rinkId, color, minStaffRequired, maxStaffAllowed } = body

    // Validate
    const validation = validateShiftDefinition({
      name,
      startTime,
      endTime,
      minStaffRequired,
      maxStaffAllowed
    })

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Check for duplicate name in same facility
    const existing = await prisma.shiftDefinition.findFirst({
      where: {
        facilityId: user.facilityId,
        name: name.trim(),
        rinkId: rinkId || null
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A shift with this name already exists' },
        { status: 400 }
      )
    }

    const shift = await prisma.shiftDefinition.create({
      data: {
        facilityId: user.facilityId,
        name: name.trim(),
        description: description?.trim() || null,
        startTime,
        endTime,
        rinkId: rinkId || null,
        color: color || '#3B82F6',
        minStaffRequired: minStaffRequired || 1,
        maxStaffAllowed: maxStaffAllowed || 5,
        isActive: true
      }
    })

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json(
      { error: 'Failed to create shift definition' },
      { status: 500 }
    )
  }
}
