import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserPermissions } from '@/lib/permissions'

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const permissions = getUserPermissions(user)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        facility: {
          id: user.facility.id,
          name: user.facility.name,
        },
        permissions,
      },
    })
  } catch (error) {
    console.error('Get session error:', error)
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    )
  }
}
