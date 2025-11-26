import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/facilities/[id] - Get a specific facility
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        rinks: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            users: true,
            submissions: true,
            formTemplates: true,
          },
        },
      },
    })

    if (!facility) {
      return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
    }

    return NextResponse.json({ facility })
  } catch (error) {
    console.error('Error fetching facility:', error)
    return NextResponse.json({ error: 'Failed to fetch facility' }, { status: 500 })
  }
}

// PATCH /api/facilities/[id] - Update a facility
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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
      subscriptionStatus,
      maxUsers,
      maxRinks,
      isActive,
    } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zipCode !== undefined) updateData.zipCode = zipCode
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) {
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
        }
      }
      updateData.email = email
    }
    if (timezone !== undefined) updateData.timezone = timezone
    if (subscriptionTier !== undefined) {
      const validTiers = ['TRIAL', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']
      if (!validTiers.includes(subscriptionTier)) {
        return NextResponse.json({ error: 'Invalid subscription tier' }, { status: 400 })
      }
      updateData.subscriptionTier = subscriptionTier
    }
    if (subscriptionStatus !== undefined) {
      const validStatuses = ['ACTIVE', 'PAST_DUE', 'CANCELLED', 'SUSPENDED']
      if (!validStatuses.includes(subscriptionStatus)) {
        return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 })
      }
      updateData.subscriptionStatus = subscriptionStatus
    }
    if (maxUsers !== undefined) updateData.maxUsers = maxUsers
    if (maxRinks !== undefined) updateData.maxRinks = maxRinks
    if (isActive !== undefined) updateData.isActive = isActive

    const facility = await prisma.facility.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ facility })
  } catch (error) {
    console.error('Error updating facility:', error)
    return NextResponse.json({ error: 'Failed to update facility' }, { status: 500 })
  }
}

// DELETE /api/facilities/[id] - Delete (deactivate) a facility
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Soft delete by setting isActive to false
    const facility = await prisma.facility.update({
      where: { id },
      data: {
        isActive: false,
        subscriptionStatus: 'CANCELLED',
      },
    })

    return NextResponse.json({ facility })
  } catch (error) {
    console.error('Error deleting facility:', error)
    return NextResponse.json({ error: 'Failed to delete facility' }, { status: 500 })
  }
}
