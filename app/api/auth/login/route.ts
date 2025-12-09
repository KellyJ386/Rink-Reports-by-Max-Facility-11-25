import { NextRequest, NextResponse } from 'next/server'
import { authenticate, generateTokens, setAuthCookies } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, RATE_LIMITS, getRateLimitKey } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // Check rate limit
    const rateLimitKey = getRateLimitKey(ip, 'login')
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMITS.login)

    if (!rateLimit.success) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          },
        }
      )
    }

    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const user = await authenticate(email, password)

    if (!user) {
      // Log failed attempt (for security monitoring)
      console.warn(`Failed login attempt for email: ${email} from IP: ${ip}`)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        {
          status: 401,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          },
        }
      )
    }

    // Generate JWT tokens (access + refresh)
    const { accessToken, refreshToken } = await generateTokens(user.id)

    // Set auth cookies
    await setAuthCookies(accessToken, refreshToken)

    // Log the login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entityType: 'User',
        entityId: user.id,
        ipAddress: ip,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role.name,
        facility: user.facility.name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    )
  }
}
