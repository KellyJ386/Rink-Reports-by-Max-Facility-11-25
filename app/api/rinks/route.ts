import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'

// GET /api/rinks - List all rinks
export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rinks = await prisma.rink.findMany({
      where: {
        facilityId: user.facilityId,
      },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ rinks })
  } catch (error) {
    console.error('Error fetching rinks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rinks' },
      { status: 500 }
    )
  }
}

// POST /api/rinks - Create a new rink
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const canManageSettings = canUserAccess(user, 'admin', 'manageSettings')
    if (!canManageSettings) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, dimensions, surfaceType = 'ice', isActive = true } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    const rink = await prisma.rink.create({
      data: {
        facilityId: user.facilityId,
        name,
        dimensions,
        surfaceType,
        isActive,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entityType: 'Rink',
        entityId: rink.id,
        newValue: { name, dimensions, surfaceType },
      },
    })

    return NextResponse.json({ rink }, { status: 201 })
  } catch (error) {
    console.error('Error creating rink:', error)
    return NextResponse.json(
      { error: 'Failed to create rink' },
      { status: 500 }
    )
  }
}
