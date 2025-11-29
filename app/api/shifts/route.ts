import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// Mock shift definitions
const mockShifts = [
  {
    id: 'shift-morning',
    name: 'Morning Shift',
    startTime: '06:00',
    endTime: '14:00',
    color: '#3B82F6',
    isActive: true,
  },
  {
    id: 'shift-evening',
    name: 'Evening Shift',
    startTime: '14:00',
    endTime: '22:00',
    color: '#10B981',
    isActive: true,
  },
  {
    id: 'shift-overnight',
    name: 'Overnight Shift',
    startTime: '22:00',
    endTime: '06:00',
    color: '#6366F1',
    isActive: true,
  },
]

export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json({
      shifts: mockShifts,
      total: mockShifts.length,
    })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = canUserAccess(user, 'admin', 'access')
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can create shift definitions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, startTime, endTime, color, rinkId } = body

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: name, startTime, endTime' },
        { status: 400 }
      )
    }

    // In production, create in database
    const shift = {
      id: `shift-${Date.now()}`,
      facilityId: user.facilityId,
      rinkId: rinkId || null,
      name,
      startTime,
      endTime,
      color: color || '#3B82F6',
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(shift, { status: 201 })
  } catch (error) {
    console.error('Error creating shift:', error)
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    )
  }
}
