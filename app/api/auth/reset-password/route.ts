import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'

interface ResetTokenPayload {
  userId: string
  email: string
  purpose: string
}

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Reset token is required' },
        { status: 400 }
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Verify token
    let payload: ResetTokenPayload
    try {
      payload = jwt.verify(token, JWT_SECRET) as ResetTokenPayload
    } catch (error) {
      if ((error as Error).name === 'TokenExpiredError') {
        return NextResponse.json(
          { error: 'Reset link has expired. Please request a new one.' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid reset link. Please request a new one.' },
        { status: 400 }
      )
    }

    // Validate token purpose
    if (payload.purpose !== 'password-reset') {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, isActive: true }
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 400 }
      )
    }

    // Verify email matches
    if (user.email !== payload.email) {
      return NextResponse.json(
        { error: 'Invalid reset token' },
        { status: 400 }
      )
    }

    // Hash new password and update
    const passwordHash = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        newValue: { action: 'password_reset_completed' }
      }
    })

    return NextResponse.json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

// GET endpoint to validate token before showing the form
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No token provided' },
        { status: 400 }
      )
    }

    // Verify token
    try {
      const payload = jwt.verify(token, JWT_SECRET) as ResetTokenPayload

      if (payload.purpose !== 'password-reset') {
        return NextResponse.json(
          { valid: false, error: 'Invalid token' },
          { status: 400 }
        )
      }

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { isActive: true }
      })

      if (!user || !user.isActive) {
        return NextResponse.json(
          { valid: false, error: 'User not found' },
          { status: 400 }
        )
      }

      return NextResponse.json({ valid: true })

    } catch (error) {
      if ((error as Error).name === 'TokenExpiredError') {
        return NextResponse.json(
          { valid: false, error: 'Token has expired' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { valid: false, error: 'Invalid token' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Validate token error:', error)
    return NextResponse.json(
      { valid: false, error: 'An error occurred' },
      { status: 500 }
    )
  }
}
