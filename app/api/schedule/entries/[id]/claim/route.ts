import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'
import { claimOpenShift } from '@/lib/schedule'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/schedule/entries/[id]/claim - Claim an open shift
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

    // Attempt to claim the shift
    const result = await claimOpenShift(id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    // Fetch the updated entry
    const updatedEntry = await prisma.scheduleEntry.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        shift: true,
        rink: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      entry: updatedEntry
    })
  } catch (error) {
    console.error('Error claiming shift:', error)
    return NextResponse.json(
      { error: 'Failed to claim shift' },
      { status: 500 }
    )
  }
}
