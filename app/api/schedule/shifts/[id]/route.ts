import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { updateShiftDefinitionSchema } from '@/types/schedule'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/schedule/shifts/[id] - Get single shift
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'access')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const shift = await prisma.shiftDefinition.findUnique({
      where: { id },
      include: {
        scheduleEntries: {
          where: {
            date: { gte: new Date() },
          },
          take: 10,
          orderBy: { date: 'asc' },
        },
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (shift.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Error fetching shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/schedule/shifts/[id] - Update shift
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'edit')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()

    const result = updateShiftDefinitionSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    const existingShift = await prisma.shiftDefinition.findUnique({
      where: { id },
    })

    if (!existingShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (existingShift.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const shift = await prisma.shiftDefinition.update({
      where: { id },
      data: result.data,
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'ShiftDefinition',
        entityId: shift.id,
        previousValue: existingShift,
        newValue: shift,
      },
    })

    return NextResponse.json({ shift })
  } catch (error) {
    console.error('Error updating shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/schedule/shifts/[id] - Delete/deactivate shift
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!canUserAccess(user, 'schedule', 'delete')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { id } = await params

    const shift = await prisma.shiftDefinition.findUnique({
      where: { id },
      include: {
        scheduleEntries: {
          where: { date: { gte: new Date() } },
          take: 1,
        },
      },
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (shift.facilityId !== user.facilityId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // If there are future schedule entries, deactivate instead of delete
    if (shift.scheduleEntries.length > 0) {
      await prisma.shiftDefinition.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json({
        success: true,
        message: 'Shift deactivated (has future entries)',
      })
    }

    await prisma.shiftDefinition.delete({
      where: { id },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entityType: 'ShiftDefinition',
        entityId: id,
        previousValue: shift,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting shift:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
