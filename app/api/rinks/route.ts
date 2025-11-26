import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

// GET /api/rinks - List rinks for the user's facility
export async function GET(request: NextRequest) {
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
    })

    return NextResponse.json(rinks)
  } catch (error) {
    console.error('Error fetching rinks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch rinks' },
      { status: 500 }
    )
  }
}
