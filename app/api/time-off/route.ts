import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/time-off - List time-off requests
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const pending = searchParams.get('pending') === 'true'

    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')

    const where: any = {}

    // If can't view all, only show own requests
    if (!canViewAll) {
      where.userId = user.id
    } else if (userId) {
      where.userId = userId
    }

    // Status filter
    if (status) {
      where.status = status
    } else if (pending) {
      where.status = 'PENDING'
    }

    const requests = await prisma.timeOffRequest.findMany({
      where,
      orderBy: [
        { status: 'asc' },
        { startDate: 'asc' },
      ],
    })

    // Get user info for each request if viewing all
    let requestsWithUsers = requests
    if (canViewAll) {
      const userIds = [...new Set(requests.map(r => r.userId))]
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true },
      })
      const userMap = Object.fromEntries(users.map(u => [u.id, u]))

      requestsWithUsers = requests.map(r => ({
        ...r,
        user: userMap[r.userId],
      }))
    }

    return NextResponse.json({ requests: requestsWithUsers })
  } catch (error) {
    console.error('Get time-off requests error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// POST /api/time-off - Create a time-off request
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { requestType, startDate, endDate, reason } = body

    // Validation
    if (!requestType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Request type, start date, and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      return NextResponse.json(
        { error: 'Start date must be before end date' },
        { status: 400 }
      )
    }

    // Check for overlapping requests
    const overlapping = await prisma.timeOffRequest.findFirst({
      where: {
        userId: user.id,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: end } },
              { endDate: { gte: start } },
            ],
          },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'You already have a time-off request for this period' },
        { status: 400 }
      )
    }

    const timeOffRequest = await prisma.timeOffRequest.create({
      data: {
        userId: user.id,
        requestType,
        startDate: start,
        endDate: end,
        reason,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ request: timeOffRequest }, { status: 201 })
  } catch (error) {
    console.error('Create time-off request error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
