import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/time-off/[id] - Get a specific time-off request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id },
    })

    if (!timeOffRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check access
    const canViewAll = canUserAccess(user, 'schedule', 'viewAll')
    if (!canViewAll && timeOffRequest.userId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ request: timeOffRequest })
  } catch (error) {
    console.error('Get time-off request error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// PUT /api/time-off/[id] - Update a time-off request (for approval/denial)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, reviewNotes, requestType, startDate, endDate, reason } = body

    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id },
    })

    if (!timeOffRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Determine what kind of update this is
    const isApprovalAction = status && ['APPROVED', 'DENIED'].includes(status)
    const isOwnRequest = timeOffRequest.userId === user.id
    const canApprove = canUserAccess(user, 'schedule', 'create') // Managers can approve

    // For approval actions, need manager permission
    if (isApprovalAction && !canApprove) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // For editing own request, must be pending and own request
    if (!isApprovalAction) {
      if (!isOwnRequest) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      if (timeOffRequest.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'Cannot edit non-pending request' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}

    if (isApprovalAction) {
      updateData.status = status
      updateData.reviewedById = user.id
      updateData.reviewedAt = new Date()
      if (reviewNotes) updateData.reviewNotes = reviewNotes
    } else {
      if (requestType) updateData.requestType = requestType
      if (startDate) updateData.startDate = new Date(startDate)
      if (endDate) updateData.endDate = new Date(endDate)
      if (reason !== undefined) updateData.reason = reason
    }

    const updated = await prisma.timeOffRequest.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ request: updated })
  } catch (error) {
    console.error('Update time-off request error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-off/[id] - Cancel a time-off request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    const timeOffRequest = await prisma.timeOffRequest.findUnique({
      where: { id },
    })

    if (!timeOffRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Only own requests can be cancelled, and only if pending
    if (timeOffRequest.userId !== user.id) {
      const canManage = canUserAccess(user, 'schedule', 'create')
      if (!canManage) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    if (timeOffRequest.status === 'APPROVED') {
      // Mark as cancelled instead of deleting approved requests
      await prisma.timeOffRequest.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
    } else {
      // Delete pending/denied requests
      await prisma.timeOffRequest.delete({
        where: { id },
      })
    }

    return NextResponse.json({ message: 'Request cancelled' })
  } catch (error) {
    console.error('Delete time-off request error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
