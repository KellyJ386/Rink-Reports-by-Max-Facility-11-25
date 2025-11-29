import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

// Mock schedule entries for demo
const mockScheduleEntries = [
  {
    id: 'entry-1',
    userId: 'user-1',
    userName: 'John Operator',
    shiftId: 'shift-morning',
    shiftName: 'Morning Shift',
    rinkId: 'rink-1',
    rinkName: 'Rink A',
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '14:00',
    isOpenShift: false,
    isEmergency: false,
    status: 'PUBLISHED',
    color: '#3B82F6',
  },
  {
    id: 'entry-2',
    userId: 'user-2',
    userName: 'Jane Smith',
    shiftId: 'shift-evening',
    shiftName: 'Evening Shift',
    rinkId: 'rink-1',
    rinkName: 'Rink A',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '22:00',
    isOpenShift: false,
    isEmergency: false,
    status: 'PUBLISHED',
    color: '#10B981',
  },
  {
    id: 'entry-3',
    userId: null,
    userName: null,
    shiftId: 'shift-morning',
    shiftName: 'Morning Shift',
    rinkId: 'rink-2',
    rinkName: 'Rink B',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '06:00',
    endTime: '14:00',
    isOpenShift: true,
    isEmergency: false,
    status: 'PUBLISHED',
    color: '#F59E0B',
  },
  {
    id: 'entry-4',
    userId: 'user-1',
    userName: 'John Operator',
    shiftId: 'shift-evening',
    shiftName: 'Evening Shift',
    rinkId: 'rink-1',
    rinkName: 'Rink A',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    startTime: '14:00',
    endTime: '22:00',
    isOpenShift: false,
    isEmergency: false,
    status: 'DRAFT',
    color: '#10B981',
  },
]

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const rinkId = searchParams.get('rinkId')
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const openShiftsOnly = searchParams.get('openShiftsOnly') === 'true'

    let entries = [...mockScheduleEntries]

    // Filter by date range
    if (startDate) {
      entries = entries.filter(e => e.date >= startDate)
    }
    if (endDate) {
      entries = entries.filter(e => e.date <= endDate)
    }

    // Filter by rink
    if (rinkId) {
      entries = entries.filter(e => e.rinkId === rinkId)
    }

    // Filter by user
    if (userId) {
      entries = entries.filter(e => e.userId === userId)
    }

    // Filter by status
    if (status) {
      entries = entries.filter(e => e.status === status)
    }

    // Filter open shifts only
    if (openShiftsOnly) {
      entries = entries.filter(e => e.isOpenShift)
    }

    // Group by date for calendar view
    const groupedByDate: Record<string, typeof entries> = {}
    entries.forEach(entry => {
      if (!groupedByDate[entry.date]) {
        groupedByDate[entry.date] = []
      }
      groupedByDate[entry.date].push(entry)
    })

    return NextResponse.json({
      entries,
      groupedByDate,
      total: entries.length,
    })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
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

    const body = await request.json()
    const {
      userId,
      shiftId,
      rinkId,
      date,
      startTime,
      endTime,
      isOpenShift = false,
      isEmergency = false,
    } = body

    // Validate required fields
    if (!rinkId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: rinkId, date, startTime, endTime' },
        { status: 400 }
      )
    }

    // In production, create schedule entry in database
    const entry = {
      id: `entry-${Date.now()}`,
      userId: isOpenShift ? null : userId,
      userName: isOpenShift ? null : 'Assigned User',
      shiftId,
      shiftName: 'Custom Shift',
      rinkId,
      rinkName: 'Selected Rink',
      date,
      startTime,
      endTime,
      isOpenShift,
      isEmergency,
      status: 'DRAFT',
      color: isEmergency ? '#EF4444' : isOpenShift ? '#F59E0B' : '#3B82F6',
      createdById: user.id,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule entry' },
      { status: 500 }
    )
  }
}
