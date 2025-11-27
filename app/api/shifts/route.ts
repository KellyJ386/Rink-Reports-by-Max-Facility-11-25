import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Validate time format (HH:MM) and return true if valid
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
  return timeRegex.test(time)
}

// Convert time string to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// GET /api/shifts - List shift definitions
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const where = {
      facilityId: user.facilityId,
      ...(includeInactive ? {} : { isActive: true }),
    }

    const [shifts, total] = await Promise.all([
      prisma.shiftDefinition.findMany({
        where,
        orderBy: { startTime: 'asc' },
        ...(limit !== undefined && { take: limit }),
        ...(offset !== undefined && { skip: offset }),
      }),
      prisma.shiftDefinition.count({ where }),
    ])

    return NextResponse.json({ shifts, total, ...(limit !== undefined && { limit, offset: offset || 0 }) })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
  }
}

// POST /api/shifts - Create shift definition
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, startTime, endTime, rinkId, color } = body

    if (!name || !startTime || !endTime) {
      return NextResponse.json({ error: 'Name, start time, and end time are required' }, { status: 400 })
    }

    // Validate time format
    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:MM (e.g., 09:00, 17:30)' }, { status: 400 })
    }

    // Validate end time is after start time
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
    }

    const shift = await prisma.shiftDefinition.create({
      data: {
        facilityId: user.facilityId,
        name,
        startTime,
        endTime,
        rinkId,
        color,
        isActive: true,
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 })
  }
}
