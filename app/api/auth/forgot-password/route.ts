import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const RESET_TOKEN_EXPIRES = '1h' // Reset tokens expire in 1 hour

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, firstName: true, isActive: true }
    })

    // Always return success to prevent email enumeration
    // In production, you would send an email here
    if (!user || !user.isActive) {
      // Return success anyway to prevent email enumeration
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      })
    }

    // Generate reset token
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        purpose: 'password-reset'
      },
      JWT_SECRET,
      { expiresIn: RESET_TOKEN_EXPIRES }
    )

    // In production, you would send an email here with a link like:
    // https://yourapp.com/reset-password?token=${resetToken}

    // In production, send email with reset link
    // For now, dev_reset_link is returned only in non-production environments

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entityType: 'User',
        entityId: user.id,
        newValue: { action: 'password_reset_requested' }
      }
    })

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      // DEV ONLY - Remove in production
      ...(process.env.NODE_ENV !== 'production' && {
        dev_token: resetToken,
        dev_reset_link: `/reset-password?token=${resetToken}`
      })
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
