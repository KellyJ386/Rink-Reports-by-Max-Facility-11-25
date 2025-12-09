import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/notifications - List notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const facilityId = searchParams.get('facilityId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userId && !facilityId) {
      return NextResponse.json(
        { error: 'Either userId or facilityId is required' },
        { status: 400 }
      )
    }

    const where: any = {}

    if (facilityId) {
      where.facilityId = facilityId
    }

    if (userId) {
      where.OR = [{ recipientUserId: userId }, { recipientUserId: null }]
    }

    if (unreadOnly) {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      facilityId,
      recipientUserId,
      recipientRoleId,
      type,
      title,
      message,
      relatedEntityType,
      relatedEntityId,
      sendEmail,
    } = body

    if (!facilityId) {
      return NextResponse.json({ error: 'Facility ID is required' }, { status: 400 })
    }

    if (!type) {
      return NextResponse.json({ error: 'Notification type is required' }, { status: 400 })
    }

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required' }, { status: 400 })
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

    const notification = await prisma.notification.create({
      data: {
        facilityId,
        recipientUserId: recipientUserId || null,
        recipientRoleId: recipientRoleId || null,
        type,
        title,
        message,
        relatedEntityType: relatedEntityType || null,
        relatedEntityId: relatedEntityId || null,
        emailSent: sendEmail || false,
        emailSentAt: sendEmail ? new Date() : null,
      },
    })

    // TODO: Integrate with actual email service (SendGrid, etc.)
    // if (sendEmail && recipientUserId) {
    //   await sendEmailNotification(notification)
    // }

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}
