import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { markNotificationAsRead } from '@/lib/notifications'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/notifications/[id] - Mark notification as read
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const notification = await markNotificationAsRead(id, user.id)

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    )
  }
}
