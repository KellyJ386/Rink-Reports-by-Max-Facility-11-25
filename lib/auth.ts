import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import type { JWTPayload, UserWithRole } from '@/types'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const ACCESS_TOKEN_EXPIRES_IN = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d' // 7 days

// Convert JWT_SECRET string to Uint8Array for jose
const getSecretKey = () => new TextEncoder().encode(JWT_SECRET)

// ==================== PASSWORD FUNCTIONS ====================

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/**
 * Verify a password against a hash
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ==================== TOKEN FUNCTIONS ====================

/**
 * Generate JWT access and refresh tokens
 * @param userId - User ID to include in token payload
 * @returns Object with accessToken and refreshToken
 */
export async function generateTokens(userId: string): Promise<{
  accessToken: string
  refreshToken: string
}> {
  const payload: JWTPayload = { userId }

  // Generate access token (15 minutes)
  const accessToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRES_IN)
    .sign(getSecretKey())

  // Generate refresh token (7 days)
  const refreshToken = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRES_IN)
    .sign(getSecretKey())

  return { accessToken, refreshToken }
}

/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as JWTPayload
  } catch (error) {
    return null
  }
}

// ==================== SESSION MANAGEMENT ====================

/**
 * Get the current user session from cookies
 * @returns User with role and facility, or null if not authenticated
 */
export async function getSession(): Promise<UserWithRole | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('access_token')

  if (!token) {
    return null
  }

  const payload = await verifyToken(token.value)
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

/**
 * Set authentication cookies for access and refresh tokens
 * @param accessToken - JWT access token
 * @param refreshToken - JWT refresh token
 */
export async function setAuthCookies(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies()

  // Set access token cookie (15 minutes)
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes in seconds
    path: '/',
  })

  // Set refresh token cookie (7 days)
  cookieStore.set('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
    path: '/',
  })
}

/**
 * Clear authentication cookies
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies()
  cookieStore.delete('access_token')
  cookieStore.delete('refresh_token')
}

/**
 * Refresh an expired access token using a refresh token
 * @returns New access token or null if refresh failed
 */
export async function refreshAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refresh_token')

  if (!refreshToken) {
    return null
  }

  const payload = await verifyToken(refreshToken.value)
  if (!payload) {
    return null
  }

  // Generate new access token
  const { accessToken } = await generateTokens(payload.userId)

  // Update access token cookie
  cookieStore.set('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 15, // 15 minutes in seconds
    path: '/',
  })

  return accessToken
}

// ==================== AUTHENTICATION ====================

/**
 * Authenticate a user with email and password
 * @param email - User email
 * @param password - User password
 * @returns User with role and facility, or null if authentication failed
 */
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

/**
 * Require authentication, throw error if not authenticated
 * @returns Authenticated user
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<UserWithRole> {
  const user = await getSession()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
