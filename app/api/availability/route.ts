import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/availability - Get employee availability
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // Can only view own availability unless has viewAll permission
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    const targetUserId = canViewAll && userId ? userId : user.id

    const availability = await prisma.employeeAvailability.findMany({
      where: { userId: targetUserId },
      orderBy: { dayOfWeek: 'asc' },
    })

    // Fill in missing days with defaults
    const fullWeek = []
    for (let day = 0; day < 7; day++) {
      const existing = availability.find(a => a.dayOfWeek === day)
      if (existing) {
        fullWeek.push(existing)
      } else {
        fullWeek.push({
          dayOfWeek: day,
          isAvailable: true,
          startTime: null,
          endTime: null,
          notes: null,
        })
      }
    }

    return NextResponse.json({ availability: fullWeek })
  } catch (error) {
    console.error('Get availability error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/availability - Update employee availability
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { availability } = body

    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { error: 'Availability must be an array' },
        { status: 400 }
      )
    }

    // Validate and upsert each day
    const results = []
    for (const day of availability) {
      if (day.dayOfWeek < 0 || day.dayOfWeek > 6) {
        continue
      }

      // Validate time format if provided
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (day.startTime && !timeRegex.test(day.startTime)) {
        return NextResponse.json(
          { error: `Invalid start time for day ${day.dayOfWeek}` },
          { status: 400 }
        )
      }
      if (day.endTime && !timeRegex.test(day.endTime)) {
        return NextResponse.json(
          { error: `Invalid end time for day ${day.dayOfWeek}` },
          { status: 400 }
        )
      }

      const result = await prisma.employeeAvailability.upsert({
        where: {
          userId_dayOfWeek: {
            userId: user.id,
            dayOfWeek: day.dayOfWeek,
          },
        },
        update: {
          isAvailable: day.isAvailable ?? true,
          startTime: day.startTime || null,
          endTime: day.endTime || null,
          notes: day.notes || null,
        },
        create: {
          userId: user.id,
          dayOfWeek: day.dayOfWeek,
          isAvailable: day.isAvailable ?? true,
          startTime: day.startTime || null,
          endTime: day.endTime || null,
          notes: day.notes || null,
        },
      })

      results.push(result)
    }

    return NextResponse.json({
      message: 'Availability updated',
      availability: results,
    })
  } catch (error) {
    console.error('Update availability error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
