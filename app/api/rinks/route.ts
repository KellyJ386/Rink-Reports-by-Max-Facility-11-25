import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List rinks for the user's facility
export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const rinks = await prisma.rink.findMany({
      where: {
        facilityId: user.facilityId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        dimensions: true,
        surfaceType: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ rinks })
  } catch (error) {
    console.error('Error fetching rinks:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
