import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// POST /api/schedule/publish - Publish multiple schedule entries
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canPublish = await canUserAccess(session.user.id, 'schedule', 'publish')
    if (!canPublish) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const body = await request.json()
    const { entryIds, startDate, endDate } = body

    // Either publish specific entries or all drafts in a date range
    const where: any = {
      status: 'DRAFT',
    }

    if (entryIds && entryIds.length > 0) {
      where.id = { in: entryIds }
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    } else {
      return NextResponse.json(
        { error: 'Either entryIds or date range is required' },
        { status: 400 }
      )
    }

    const result = await prisma.scheduleEntry.updateMany({
      where,
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        publishedById: session.user.id,
      },
    })

    // TODO: Send notifications to affected users

    return NextResponse.json({
      success: true,
      publishedCount: result.count,
    })
  } catch (error) {
    console.error('Error publishing schedule:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
