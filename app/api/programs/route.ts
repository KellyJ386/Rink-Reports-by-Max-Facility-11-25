import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

// GET /api/programs - List all programs
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false'

    const where: Record<string, unknown> = {
      facilityId: user.facilityId
    }

    if (activeOnly) {
      where.isActive = true
    }

    const programs = await prisma.program.findMany({
      where,
      orderBy: [
        { name: 'asc' }
      ]
    })

    return NextResponse.json(programs)
  } catch (error) {
    console.error('Error fetching programs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    )
  }
}

// POST /api/programs - Create a new program
export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)
    if (!permissions.admin?.edit) {
      return NextResponse.json(
        { error: 'You do not have permission to create programs' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, description, color } = body

    // Validate
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Program name is required' },
        { status: 400 }
      )
    }

    // Check for duplicate name in same facility
    const existing = await prisma.program.findFirst({
      where: {
        facilityId: user.facilityId,
        name: name.trim()
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A program with this name already exists' },
        { status: 400 }
      )
    }

    const program = await prisma.program.create({
      data: {
        facilityId: user.facilityId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#3B82F6',
        isActive: true
      }
    })

    return NextResponse.json(program, { status: 201 })
  } catch (error) {
    console.error('Error creating program:', error)
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    )
  }
}
