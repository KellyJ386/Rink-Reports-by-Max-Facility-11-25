import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/notifications/preferences - Get user notification preferences
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        smsOptIn: true,
        smsPreference: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ preferences: user })
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

// PATCH /api/notifications/preferences - Update user notification preferences
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, phone, smsOptIn, smsPreference } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Validate SMS preference if provided
    if (smsPreference && !['ALL', 'CRITICAL_ONLY', 'NONE'].includes(smsPreference)) {
      return NextResponse.json(
        { error: 'Invalid SMS preference. Must be ALL, CRITICAL_ONLY, or NONE' },
        { status: 400 }
      )
    }

    // Validate phone number format if provided
    if (phone !== undefined && phone !== null && phone !== '') {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (phone !== undefined) updateData.phone = phone
    if (smsOptIn !== undefined) updateData.smsOptIn = smsOptIn
    if (smsPreference !== undefined) updateData.smsPreference = smsPreference

    // If opting out of SMS, set smsOptIn to false
    if (smsPreference === 'NONE' && smsOptIn !== false) {
      updateData.smsOptIn = false
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        smsOptIn: true,
        smsPreference: true,
      },
    })

    return NextResponse.json({ preferences: user })
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
