import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // In production, fetch from database
    const entry = {
      id,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error fetching schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule entry' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if publishing (requires admin permissions)
    if (body.status === 'PUBLISHED') {
      const isAdmin = canUserAccess(user, 'admin', 'access')
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only admins can publish schedules' },
          { status: 403 }
        )
      }
    }

    // In production, update in database
    const entry = {
      id,
      ...body,
      updatedAt: new Date().toISOString(),
    }

    // If publishing, create notifications
    if (body.status === 'PUBLISHED') {
      // TODO: Create notifications for affected users
      // TODO: Send emails/SMS based on preferences
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const isAdmin = canUserAccess(user, 'admin', 'access')
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can delete schedule entries' },
        { status: 403 }
      )
    }

    const { id } = await params

    // In production, delete from database
    return NextResponse.json({ success: true, deletedId: id })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule entry' },
      { status: 500 }
    )
  }
}
