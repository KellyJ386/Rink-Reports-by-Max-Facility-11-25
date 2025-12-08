import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

// GET /api/employees - List employees for the facility (for schedule assignment)
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Need either schedule.create or admin.access to list employees
    const canManageSchedule = canUserAccess(user, 'schedule', 'create')
    const isAdmin = canUserAccess(user, 'admin', 'access')

    if (!canManageSchedule && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const employees = await prisma.user.findMany({
      where: {
        facilityId: user.facilityId,
        ...(activeOnly && { isActive: true }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    })

    return NextResponse.json({ employees })
  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
