import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/rinks - List all rinks for the facility
export async function GET(_request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rinks = await prisma.rink.findMany({
      where: {
        facilityId: user.facilityId,
        isActive: true,
      },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
      },
    })

    return NextResponse.json({ rink }, { status: 201 })
  } catch (error) {
    console.error('Error fetching rinks:', error)
    return NextResponse.json(
      { error: 'An error occurred while fetching rinks' },
      { status: 500 }
    )
  }
}
