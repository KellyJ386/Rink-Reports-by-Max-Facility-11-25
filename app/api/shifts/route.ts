import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/shifts - List all shift definitions for a facility
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facilityId = searchParams.get('facilityId')
    const rinkId = searchParams.get('rinkId')

    if (!facilityId) {
      return NextResponse.json({ error: 'facilityId is required' }, { status: 400 })
    }

    const where: any = {
      facilityId,
      isActive: true,
    }

    // Filter by rink if specified, or get facility-wide shifts
    if (rinkId) {
      where.OR = [{ rinkId }, { rinkId: null }]
    }

    const shifts = await prisma.shiftDefinition.findMany({
      where,
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
  }
}

// POST /api/shifts - Create a new shift definition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facilityId, rinkId, name, startTime, endTime, color } = body

    if (!facilityId || !name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'facilityId, name, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'startTime and endTime must be in HH:MM format (24-hour)' },
        { status: 400 }
      )
    }

    const shift = await prisma.shiftDefinition.create({
      data: {
        facilityId,
        rinkId: rinkId || null,
        name,
        startTime,
        endTime,
        color: color || '#3B82F6', // Default blue
      },
    })

    return NextResponse.json({ shift }, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json({ error: 'Failed to create shift' }, { status: 500 })
  }
}
