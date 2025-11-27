import jwt, { Secret } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import type { JWTPayload, UserWithRole } from '@/types'

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'development-secret-key-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

// Only check for JWT_SECRET at runtime, not during build
if (typeof window === 'undefined' && !process.env.JWT_SECRET && process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.warn('JWT_SECRET environment variable is not set. Using default secret for development.')
}

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
  return jwt.sign(payload as object, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
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
