import { NextResponse } from 'next/server'
import { getUserPermissions } from '@/lib/permissions'
import { withAuth } from '@/lib/middleware'

export const GET = withAuth(async (user) => {
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
})
