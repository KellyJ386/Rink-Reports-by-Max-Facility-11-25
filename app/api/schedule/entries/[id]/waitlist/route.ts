import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { joinShiftWaitlist, leaveShiftWaitlist } from '@/lib/schedule'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/schedule/entries/[id]/waitlist - Get waitlist for a shift
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await context.params

    const entry = await prisma.scheduleEntry.findUnique({
      where: { id },
      select: {
        id: true,
        facilityId: true,
        waitlistUsers: true,
        isOpenShift: true
      }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    if (entry.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const waitlistUserIds = (entry.waitlistUsers as string[]) || []

    // Fetch user details for waitlist
    const waitlistUsers = await prisma.user.findMany({
      where: {
        id: { in: waitlistUserIds }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true
      }
    })

    // Maintain order
    const orderedWaitlist = waitlistUserIds.map(userId =>
      waitlistUsers.find(u => u.id === userId)
    ).filter(Boolean)

    return NextResponse.json({
      entryId: entry.id,
      isOpenShift: entry.isOpenShift,
      waitlist: orderedWaitlist,
      totalCount: orderedWaitlist.length,
      currentUserPosition: waitlistUserIds.indexOf(user.id) + 1 || null
    })
  } catch (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}

// POST /api/schedule/entries/[id]/waitlist - Join waitlist
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await context.params

    // Verify the entry exists and belongs to user's facility
    const entry = await prisma.scheduleEntry.findUnique({
      where: { id }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    if (entry.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await joinShiftWaitlist(id, user.id)

    if (!result.success) {
      return NextResponse.json({
        error: result.message,
        position: result.position
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      position: result.position
    })
  } catch (error) {
    console.error('Error joining waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/entries/[id]/waitlist - Leave waitlist
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await context.params

    // Verify the entry exists and belongs to user's facility
    const entry = await prisma.scheduleEntry.findUnique({
      where: { id }
    })

    if (!entry) {
      return NextResponse.json({ error: 'Schedule entry not found' }, { status: 404 })
    }

    if (entry.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const result = await leaveShiftWaitlist(id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: result.message
    })
  } catch (error) {
    console.error('Error leaving waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to leave waitlist' },
      { status: 500 }
    )
  }
}
