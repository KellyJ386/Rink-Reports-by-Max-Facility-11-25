import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

interface RouteParams {
  params: Promise<{ id: string }>
}

// PUT /api/schedule/[id] - Update schedule entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canEdit = await canUserAccess(session.user.id, 'schedule', 'edit')
    if (!canEdit) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { userId, startTime, endTime, status, isOpenShift, isEmergency } = body

    const entry = await prisma.scheduleEntry.update({
      where: { id },
      data: {
        userId,
        startTime,
        endTime,
        status,
        isOpenShift,
        isEmergency,
        ...(status === 'PUBLISHED' && {
          publishedAt: new Date(),
          publishedById: session.user.id,
        }),
      },
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

    return NextResponse.json({ entry })
  } catch (error) {
    console.error('Error updating schedule entry:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}

// DELETE /api/schedule/[id] - Delete schedule entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const canDelete = await canUserAccess(session.user.id, 'schedule', 'delete')
    if (!canDelete) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const { id } = await params

    await prisma.scheduleEntry.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule entry:', error)
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 })
  }
}
