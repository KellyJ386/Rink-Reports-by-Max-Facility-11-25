import { NextRequest, NextResponse } from 'next/server'
import { createNotification, NotificationType } from '@/lib/services/notificationService'

/**
 * POST /api/webhooks/notifications
 * External webhook endpoint for triggering notifications
 *
 * Requires API key authentication via X-API-Key header
 *
 * Body:
 * {
 *   facilityId: string
 *   type: NotificationType
 *   title: string
 *   message: string
 *   recipientUserId?: string
 *   sendEmail?: boolean
 *   sendSMS?: boolean
 *   relatedEntityType?: string
 *   relatedEntityId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Validate API key
    const apiKey = request.headers.get('X-API-Key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Include X-API-Key header.' },
        { status: 401 }
      )
    }

    // In production, validate against stored API keys in database
    // For now, use environment variable
    const validApiKey = process.env.WEBHOOK_API_KEY || 'dev-webhook-key-12345'

    if (apiKey !== validApiKey) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      facilityId,
      type,
      title,
      message,
      recipientUserId,
      sendEmail = true,
      sendSMS = false,
      relatedEntityType,
      relatedEntityId,
    } = body

    // Validate required fields
    if (!facilityId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: facilityId, type, title, message' },
        { status: 400 }
      )
    }

    // Validate notification type
    const validTypes: NotificationType[] = [
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
      return NextResponse.json(
        { error: `Invalid notification type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Create the notification
    const notification = await createNotification({
      facilityId,
      type,
      title,
      message,
      recipientUserId,
      sendEmail,
      sendSMS,
      relatedEntityType,
      relatedEntityId,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Notification created successfully',
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          sentAt: notification.sentAt,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Webhook notification error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
