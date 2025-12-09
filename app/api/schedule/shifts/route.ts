import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { createShiftDefinitionSchema, updateShiftDefinitionSchema } from '@/types/schedule'

// GET /api/schedule/shifts - Get shift definitions
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
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const rinkId = searchParams.get('rinkId')

    const where: any = {
      facilityId: user.facilityId,
    }

    if (activeOnly) {
      where.isActive = true
    }

    if (rinkId) {
      where.OR = [
        { rinkId: null }, // Facility-wide shifts
        { rinkId }, // Rink-specific shifts
      ]
    }

    const shifts = await prisma.shiftDefinition.findMany({
      where,
      orderBy: [{ startTime: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Error fetching shift definitions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedule/shifts - Create shift definition
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
    const result = createShiftDefinitionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const data = result.data

    const shift = await prisma.shiftDefinition.create({
      data: {
        facilityId: user.facilityId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        color: data.color || null,
        breakMinutes: data.breakMinutes || 0,
        minEmployees: data.minEmployees || 1,
        maxEmployees: data.maxEmployees || null,
        description: data.description || null,
        rinkId: data.rinkId || null,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'ShiftDefinition',
        entityId: shift.id,
        newValue: shift,
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    console.error('Error creating shift definition:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
