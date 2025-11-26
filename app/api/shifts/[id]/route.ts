import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/shifts/[id] - Update a shift definition
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, startTime, endTime, color, isActive } = body

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
    if (name !== undefined) updateData.name = name
    if (startTime !== undefined) updateData.startTime = startTime
    if (endTime !== undefined) updateData.endTime = endTime
    if (color !== undefined) updateData.color = color
    if (isActive !== undefined) updateData.isActive = isActive

    const shift = await prisma.shiftDefinition.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Error updating shift:', error)
    return NextResponse.json({ error: 'Failed to update shift' }, { status: 500 })
  }
}

// DELETE /api/shifts/[id] - Soft delete a shift definition
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Soft delete by setting isActive to false
    const shift = await prisma.shiftDefinition.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return NextResponse.json({ error: 'Failed to delete shift' }, { status: 500 })
  }
}
