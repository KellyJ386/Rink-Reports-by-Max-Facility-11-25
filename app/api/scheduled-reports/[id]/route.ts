import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, getClientInfo } from '@/lib/security/rbac'
import { logUpdate, logDelete, logAccessDenied } from '@/lib/security/auditLogger'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scheduledReport = await prisma.scheduledReport.findUnique({
      where: { id },
    })

    if (!scheduledReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 })
    }

    const hasPermission = await checkPermission(userId, 'admin', 'manageSettings')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'ScheduledReport',
        id,
        'Missing admin.manageSettings permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ scheduledReport }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching scheduled report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 })
    }

    const hasPermission = await checkPermission(userId, 'admin', 'manageSettings')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'ScheduledReport',
        id,
        'Missing admin.manageSettings permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.reportType !== undefined) updateData.reportType = body.reportType
    if (body.format !== undefined) updateData.format = body.format
    if (body.frequency !== undefined) {
      updateData.frequency = body.frequency
      updateData.nextRunAt = calculateNextRunDate(body.frequency)
    }
    if (body.recipients !== undefined) updateData.recipients = body.recipients
    if (body.config !== undefined) updateData.config = body.config
    if (body.isActive !== undefined) updateData.isActive = body.isActive

    const scheduledReport = await prisma.scheduledReport.update({
      where: { id },
      data: updateData,
    })

    const { ipAddress, userAgent } = getClientInfo(request)
    await logUpdate({
      userId,
      facilityId: scheduledReport.facilityId,
      entityType: 'ScheduledReport',
      entityId: id,
      previousValue: existingReport,
      newValue: scheduledReport,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ scheduledReport }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating scheduled report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id')
    const { id } = params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existingReport = await prisma.scheduledReport.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json({ error: 'Scheduled report not found' }, { status: 404 })
    }

    const hasPermission = await checkPermission(userId, 'admin', 'manageSettings')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'ScheduledReport',
        id,
        'Missing admin.manageSettings permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.scheduledReport.delete({
      where: { id },
    })

    const { ipAddress, userAgent } = getClientInfo(request)
    await logDelete({
      userId,
      facilityId: existingReport.facilityId,
      entityType: 'ScheduledReport',
      entityId: id,
      previousValue: existingReport,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Error deleting scheduled report:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function calculateNextRunDate(frequency: string): Date {
  const now = new Date()
  const next = new Date(now)

  switch (frequency) {
    case 'daily':
      next.setDate(now.getDate() + 1)
      next.setHours(0, 0, 0, 0)
      break
    case 'weekly':
      next.setDate(now.getDate() + 7)
      next.setHours(0, 0, 0, 0)
      break
    case 'monthly':
      next.setMonth(now.getMonth() + 1)
      next.setDate(1)
      next.setHours(0, 0, 0, 0)
      break
    case 'quarterly':
      next.setMonth(now.getMonth() + 3)
      next.setDate(1)
      next.setHours(0, 0, 0, 0)
      break
    default:
      next.setDate(now.getDate() + 1)
      next.setHours(0, 0, 0, 0)
  }

  return next
}
