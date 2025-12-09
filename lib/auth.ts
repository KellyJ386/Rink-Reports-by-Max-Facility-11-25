import jwt, { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import type { JWTPayload, UserWithRole } from '@/types'

// SECURITY: JWT_SECRET must be set in environment variables
// In production, this will throw an error if not configured
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production')
  }
  // Only allow fallback in development with a warning
  console.warn('WARNING: Using fallback JWT_SECRET. Set JWT_SECRET in environment variables.')
}
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-only-fallback-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
  // Cast expiresIn to satisfy the type - it accepts strings like '7d'
  return jwt.sign(payload, EFFECTIVE_JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions)
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, EFFECTIVE_JWT_SECRET) as JWTPayload
  } catch (error) {
    return null
  }
}

export async function getSession(): Promise<UserWithRole | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')

  if (!token) {
    return null
  }

  const payload = verifyToken(token.value)
  if (!payload) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: {
      role: true,
      facility: true,
    },
  })

  if (!user || !user.isActive) {
    return null
  }

  return user
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('auth_token')
}

export async function authenticate(
  email: string,
  password: string
): Promise<UserWithRole | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: true,
      facility: true,
    },
  })

  if (!user || !user.isActive) {
    return null
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    return null
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return user
}

export async function requireAuth(): Promise<UserWithRole> {
  const user = await getSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
