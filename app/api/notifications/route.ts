import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/notifications - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50') || 50))
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0') || 0)

    const where = {
      facilityId: user.facilityId,
      OR: [
        { recipientUserId: user.id },
        { recipientRoleId: user.roleId },
        { recipientUserId: null, recipientRoleId: null }, // Broadcast notifications
      ],
      ...(unreadOnly && { isRead: false }),
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({ where }),
    ])

    const unreadCount = await prisma.notification.count({
      where: {
        ...where,
        isRead: false,
      },
    })

    return NextResponse.json({
      notifications,
      total,
      unreadCount,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST /api/notifications - Create a notification (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can create notifications
    if (!canUserAccess(user, 'admin', 'create')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      recipientUserId,
      recipientRoleId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
    } = body

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      )
    }

    // Validate content is not just whitespace
    if (!title.trim() || !message.trim()) {
      return NextResponse.json({ error: 'Title and message cannot be empty' }, { status: 400 })
    }

    // Validate input lengths
    if (title.length > 255) {
      return NextResponse.json({ error: 'Title must be 255 characters or less' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message must be 2000 characters or less' }, { status: 400 })
    }

    // Validate notification type
    const validTypes = [
      'INCIDENT_SUBMITTED',
      'INCIDENT_AMBULANCE',
      'AIR_QUALITY_WARNING',
      'AIR_QUALITY_EVACUATION',
      'SCHEDULE_PUBLISHED',
      'SHIFT_OPEN',
      'SHIFT_EMERGENCY',
      'REPORT_REMINDER',
      'SYSTEM',
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    // If targeting a specific user, verify they belong to the same facility
    if (recipientUserId) {
      const targetUser = await prisma.user.findFirst({
        where: { id: recipientUserId, facilityId: user.facilityId },
      })
      if (!targetUser) {
        return NextResponse.json({ error: 'Recipient user not found' }, { status: 404 })
      }
    }

    // If targeting a role, verify it exists for this facility
    if (recipientRoleId) {
      const role = await prisma.role.findFirst({
        where: {
          id: recipientRoleId,
          OR: [{ facilityId: user.facilityId }, { isSystemDefault: true }],
        },
      })
      if (!role) {
        return NextResponse.json({ error: 'Recipient role not found' }, { status: 404 })
      }
    }

    const notification = await prisma.notification.create({
      data: {
        facilityId: user.facilityId,
        recipientUserId,
        recipientRoleId,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
      },
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
