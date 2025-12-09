import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkPermission, getClientInfo } from '@/lib/security/rbac'
import { logCreate, logAccessDenied } from '@/lib/security/auditLogger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = request.headers.get('x-user-id')
    const facilityId = searchParams.get('facilityId')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!facilityId) {
      return NextResponse.json({ error: 'facilityId is required' }, { status: 400 })
    }

    const hasPermission = await checkPermission(userId, 'admin', 'manageSettings')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'ScheduledReport',
        facilityId,
        'Missing admin.manageSettings permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const scheduledReports = await prisma.scheduledReport.findMany({
      where: {
        facilityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ scheduledReports }, { status: 200 })
  } catch (error: any) {
    console.error('Error fetching scheduled reports:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      facilityId,
      name,
      reportType,
      format,
      frequency,
      recipients,
      config,
    } = body

    if (!facilityId || !name || !reportType || !frequency || !recipients) {
      return NextResponse.json(
        { error: 'Missing required fields: facilityId, name, reportType, frequency, recipients' },
        { status: 400 }
      )
    }

    const hasPermission = await checkPermission(userId, 'admin', 'manageSettings')
    if (!hasPermission) {
      const { ipAddress, userAgent } = getClientInfo(request)
      await logAccessDenied(
        userId,
        'ScheduledReport',
        facilityId,
        'Missing admin.manageSettings permission',
        ipAddress,
        userAgent
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const nextRunAt = calculateNextRunDate(frequency)

    const scheduledReport = await prisma.scheduledReport.create({
      data: {
        facilityId,
        name,
        reportType,
        format: format || 'pdf',
        frequency,
        recipients,
        config: config || null,
        nextRunAt,
        createdBy: userId,
      },
    })

    const { ipAddress, userAgent } = getClientInfo(request)
    await logCreate({
      userId,
      facilityId,
      entityType: 'ScheduledReport',
      entityId: scheduledReport.id,
      newValue: scheduledReport,
      ipAddress,
      userAgent,
    })

    return NextResponse.json({ scheduledReport }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating scheduled report:', error)
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
