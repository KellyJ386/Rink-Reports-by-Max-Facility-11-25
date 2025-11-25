import { NextResponse } from 'next/server'
import { clearAuthCookies, getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const user = await getSession()

    if (user) {
      // Log the logout
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGOUT',
          entityType: 'User',
          entityId: user.id,
        },
      })
    }

    await clearAuthCookies()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}
