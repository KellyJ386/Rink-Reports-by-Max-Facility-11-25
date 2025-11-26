import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/schedule/[id] - Update a schedule entry
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { userId, date, startTime, endTime, status, isOpenShift, waitlistUsers, publishedById } =
      body

    // Validate time format if provided
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    if (startTime && !timeRegex.test(startTime)) {
      return NextResponse.json(
        { error: 'startTime must be in HH:MM format (24-hour)' },
        { status: 400 }
      )
    }
    if (endTime && !timeRegex.test(endTime)) {
      return NextResponse.json(
        { error: 'endTime must be in HH:MM format (24-hour)' },
        { status: 400 }
      )
    }

    const updateData: any = {}
    if (userId !== undefined) updateData.userId = userId
    if (date !== undefined) updateData.date = new Date(date)
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (status !== undefined) {
      updateData.status = status
      if (status === 'PUBLISHED') {
        updateData.publishedAt = new Date()
        if (publishedById) updateData.publishedById = publishedById
      }
    }
    if (isOpenShift !== undefined) updateData.isOpenShift = isOpenShift
    if (waitlistUsers !== undefined) updateData.waitlistUsers = waitlistUsers

    const entry = await prisma.scheduleEntry.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return NextResponse.json({ error: 'Failed to update schedule entry' }, { status: 500 })
  }
}

// DELETE /api/schedule/[id] - Delete a schedule entry
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const entry = await prisma.scheduleEntry.delete({
      where: { id },
    })

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return NextResponse.json({ error: 'Failed to delete schedule entry' }, { status: 500 })
  }
}
