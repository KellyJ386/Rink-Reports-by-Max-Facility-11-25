import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

// GET /api/sms/[id] - Get a specific SMS log entry (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'access')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const smsLog = await prisma.sMSLog.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!smsLog) {
      return NextResponse.json({ error: 'SMS log not found' }, { status: 404 })
    }

    return NextResponse.json({ smsLog })
  } catch (error) {
    console.error('Error fetching SMS log:', error)
    return NextResponse.json({ error: 'Failed to fetch SMS log' }, { status: 500 })
  }
}

// PATCH /api/sms/[id] - Update SMS log status (for webhook callbacks)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'admin', 'edit')) {
      return NextResponse.json({ error: 'Admin permission required' }, { status: 403 })
    }

    const existingLog = await prisma.sMSLog.findFirst({
      where: {
        id,
        facilityId: user.facilityId,
      },
    })

    if (!existingLog) {
      return NextResponse.json({ error: 'SMS log not found' }, { status: 404 })
    }

    const body = await request.json()
    const { status, providerMessageId, errorCode, errorMessage, deliveredAt } = body

    // Validate status if provided
    const validStatuses = ['QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'UNDELIVERED']
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Validate error message length
    if (errorMessage && errorMessage.length > 500) {
      return NextResponse.json({ error: 'Error message must be 500 characters or less' }, { status: 400 })
    }

    const smsLog = await prisma.sMSLog.update({
      where: { id },
      data: {
        ...(status && { status, statusUpdatedAt: new Date() }),
        ...(providerMessageId && { providerMessageId }),
        ...(errorCode !== undefined && { errorCode }),
        ...(errorMessage !== undefined && { errorMessage }),
        ...(deliveredAt && { deliveredAt: new Date(deliveredAt) }),
      },
    })

    return NextResponse.json({ smsLog })
  } catch (error) {
    console.error('Error updating SMS log:', error)
    return NextResponse.json({ error: 'Failed to update SMS log' }, { status: 500 })
  }
}
