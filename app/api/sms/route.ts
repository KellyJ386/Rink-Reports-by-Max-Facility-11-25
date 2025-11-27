import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/sms - List SMS logs (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can view SMS logs
    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const messageType = searchParams.get('messageType')

    const where = {
      facilityId: user.facilityId,
      ...(status && { status }),
      ...(messageType && { messageType }),
    }

    const [logs, total] = await Promise.all([
      prisma.sMSLog.findMany({
        where,
        orderBy: { sentAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.sMSLog.count({ where }),
    ])

    // Get stats
    const stats = await prisma.sMSLog.groupBy({
      by: ['status'],
      where: { facilityId: user.facilityId },
      _count: true,
    })

    return NextResponse.json({
      logs,
      total,
      limit,
      offset,
      stats: stats.reduce(
        (acc, { status, _count }) => ({ ...acc, [status]: _count }),
        {}
      ),
    })
  } catch (error) {
    console.error('Error fetching SMS logs:', error)
    return NextResponse.json({ error: 'Failed to fetch SMS logs' }, { status: 500 })
  }
}

// POST /api/sms - Send an SMS (admin only, placeholder for actual SMS integration)
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can send SMS
    if (!canUserAccess(user, 'admin', 'create')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const body = await request.json()
    const { userId, phoneNumber, messageType, messageBody } = body

    if (!messageType || !messageBody) {
      return NextResponse.json(
        { error: 'Message type and body are required' },
        { status: 400 }
      )
    }

    if (!userId && !phoneNumber) {
      return NextResponse.json(
        { error: 'Either userId or phoneNumber is required' },
        { status: 400 }
      )
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

    if (!validTypes.includes(messageType)) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 })
    }

    // Check if SMS is enabled in settings
    const settings = await prisma.facilitySettings.findUnique({
      where: { facilityId: user.facilityId },
    })

    if (!settings?.smsEnabled) {
      return NextResponse.json(
        { error: 'SMS notifications are not enabled for this facility' },
        { status: 400 }
      )
    }

    // Get phone number if userId provided
    let targetPhone = phoneNumber
    if (userId && !phoneNumber) {
      const targetUser = await prisma.user.findFirst({
        where: { id: userId, facilityId: user.facilityId },
      })
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (!targetUser.phone) {
        return NextResponse.json(
          { error: 'User does not have a phone number configured' },
          { status: 400 }
        )
      }
      targetPhone = targetUser.phone
    }

    // Create SMS log entry (status: QUEUED - actual sending handled by background job)
    const smsLog = await prisma.sMSLog.create({
      data: {
        facilityId: user.facilityId,
        userId,
        phoneNumber: targetPhone,
        messageType,
        messageBody,
        status: 'QUEUED',
      },
    })

    // TODO: Implement actual SMS sending via Twilio/other provider
    // This would typically be done via a background job that:
    // 1. Checks settings for provider credentials
    // 2. Sends the SMS via the provider API
    // 3. Updates the log with providerMessageId and status

    return NextResponse.json(
      {
        smsLog,
        message: 'SMS queued for delivery',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error sending SMS:', error)
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 })
  }
}
