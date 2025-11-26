import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/schedule/[id] - Update a schedule entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.edit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { userId, startTime, endTime, status, isOpenShift, isEmergency } = body

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Build update data
    const updateData: any = {}
    if (userId !== undefined) updateData.userId = userId
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (isOpenShift !== undefined) updateData.isOpenShift = isOpenShift
    if (isEmergency !== undefined) updateData.isEmergency = isEmergency

    // Handle status changes
    if (status !== undefined) {
      updateData.status = status
      if (status === 'PUBLISHED' && permissions.schedule?.publish) {
        updateData.publishedAt = new Date()
        updateData.publishedById = user.id
      }
    }

    const entry = await prisma.scheduleEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/[id] - Delete a schedule entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.schedule?.edit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.scheduleEntry.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Only allow deletion of draft entries
    if (existing.status !== 'DRAFT') {
      // Cancel instead of delete
      await prisma.scheduleEntry.update({
        where: { id },
        data: { status: 'CANCELLED' },
      })
      return NextResponse.json({ message: 'Entry cancelled' })
    }

    await prisma.scheduleEntry.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Entry deleted' })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule entry' },
      { status: 500 }
    )
  }
}
