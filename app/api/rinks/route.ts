import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET /api/rinks - List all rinks for the user's facility
export async function GET() {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rinks = await prisma.rink.findMany({
      where: {
        facility: { id: user.facilityId },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        dimensions: true,
        surfaceType: true,
        iceDepthConfig: true,
        iceDepthConfiguration: {
          select: {
            presetType: true,
            measurementPoints: true,
            backgroundImage: true,
            targetDepth: true,
            optimalTolerance: true,
            warningTolerance: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ rinks })
  } catch (error) {
    console.error('Error fetching rinks:', error)
    return NextResponse.json({ error: 'Failed to fetch rinks' }, { status: 500 })
  }
}
