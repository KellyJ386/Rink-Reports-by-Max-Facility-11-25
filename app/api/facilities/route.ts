import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/facilities - List all facilities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    const facilities = await prisma.facility.findMany({
      where,
      include: {
        _count: {
          select: {
            users: true,
            rinks: true,
            submissions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ facilities })
  } catch (error) {
    console.error('Error fetching facilities:', error)
    return NextResponse.json({ error: 'Failed to fetch facilities' }, { status: 500 })
  }
}

// POST /api/facilities - Create a new facility
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      timezone,
      subscriptionTier,
      maxUsers,
      maxRinks,
    } = body

    if (!name) {
      return NextResponse.json({ error: 'Facility name is required' }, { status: 400 })
    }

    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }
    }

    // Validate subscription tier if provided
    if (subscriptionTier) {
      const validTiers = ['TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']
      if (!validTiers.includes(subscriptionTier)) {
        return NextResponse.json(
          { error: 'Invalid subscription tier. Must be TRIAL, BASIC, PROFESSIONAL, or ENTERPRISE' },
          { status: 400 }
        )
      }
    }

    const facility = await prisma.facility.create({
      data: {
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        phone: phone || null,
        email: email || null,
        timezone: timezone || 'America/Los_Angeles',
        subscriptionTier: subscriptionTier || 'TRIAL',
        subscriptionStatus: 'ACTIVE',
        maxUsers: maxUsers || 10,
        maxRinks: maxRinks || 2,
        isActive: true,
      },
    })

    return NextResponse.json({ facility }, { status: 201 })
  } catch (error) {
    console.error('Error creating facility:', error)
    return NextResponse.json({ error: 'Failed to create facility' }, { status: 500 })
  }
}
