import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  getSession,
  setAuthCookie,
  clearAuthCookie,
  authenticate,
  requireAuth,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import type { JWTPayload } from '@/types'

// Mock data
const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  passwordHash: '',
  firstName: 'Test',
  lastName: 'User',
  phone: null,
  isActive: true,
  roleId: 'role-123',
  facilityId: 'facility-123',
  permissionOverrides: null,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  role: {
    id: 'role-123',
    name: 'Operator',
    description: 'Basic operator',
    permissions: {},
    facilityId: 'facility-123',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  facility: {
    id: 'facility-123',
    name: 'Test Facility',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    timezone: 'America/New_York',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
}

const mockJWTPayload: JWTPayload = {
  userId: 'user-123',
  email: 'test@example.com',
  facilityId: 'facility-123',
  roleId: 'role-123',
}

describe('Auth Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const password = 'testPassword123!'
      const hashedPassword = await hashPassword(password)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(password)
      expect(hashedPassword.length).toBeGreaterThan(0)
    })

    it('should produce different hashes for the same password (due to salt)', async () => {
      const password = 'testPassword123!'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should produce a hash that starts with bcrypt identifier', async () => {
      const password = 'testPassword123!'
      const hashedPassword = await hashPassword(password)

      // bcrypt hashes start with $2a$ or $2b$
      expect(hashedPassword).toMatch(/^\$2[ab]\$/)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123!'
      const hashedPassword = await bcrypt.hash(password, 10)

      const result = await verifyPassword(password, hashedPassword)

      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123!'
      const wrongPassword = 'wrongPassword456!'
      const hashedPassword = await bcrypt.hash(password, 10)

      const result = await verifyPassword(wrongPassword, hashedPassword)

      expect(result).toBe(false)
    })

    it('should handle empty password correctly', async () => {
      const password = 'testPassword123!'
      const hashedPassword = await bcrypt.hash(password, 10)

      const result = await verifyPassword('', hashedPassword)

      expect(result).toBe(false)
    })
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockJWTPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include the payload data in the token', () => {
      const token = generateToken(mockJWTPayload)
      const decoded = jwt.decode(token) as JWTPayload

      expect(decoded.userId).toBe(mockJWTPayload.userId)
      expect(decoded.email).toBe(mockJWTPayload.email)
      expect(decoded.facilityId).toBe(mockJWTPayload.facilityId)
      expect(decoded.roleId).toBe(mockJWTPayload.roleId)
    })

    it('should include expiration in the token', () => {
      const token = generateToken(mockJWTPayload)
      const decoded = jwt.decode(token) as JWTPayload & { exp: number }

      expect(decoded.exp).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(Date.now() / 1000)
    })
  })

  describe('verifyToken', () => {
    it('should return payload for a valid token', () => {
      const token = generateToken(mockJWTPayload)
      const result = verifyToken(token)

      expect(result).not.toBeNull()
      expect(result?.userId).toBe(mockJWTPayload.userId)
      expect(result?.email).toBe(mockJWTPayload.email)
    })

    it('should return null for an invalid token', () => {
      const result = verifyToken('invalid-token')

      expect(result).toBeNull()
    })

    it('should return null for a malformed token', () => {
      const result = verifyToken('not.a.valid.jwt.token')

      expect(result).toBeNull()
    })

    it('should return null for an expired token', () => {
      // Create a token that expires immediately
      const expiredToken = jwt.sign(mockJWTPayload, 'test-secret-key-for-testing', {
        expiresIn: '-1s',
      })

      const result = verifyToken(expiredToken)

      expect(result).toBeNull()
    })

    it('should return null for a token signed with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(mockJWTPayload, 'wrong-secret')

      const result = verifyToken(tokenWithWrongSecret)

      expect(result).toBeNull()
    })
  })

  describe('getSession', () => {
    it('should return null when no auth token cookie exists', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await getSession()

      expect(result).toBeNull()
      expect(mockCookieStore.get).toHaveBeenCalledWith('auth_token')
    })

    it('should return null when token is invalid', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: 'invalid-token' }),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should return null when user is not found', async () => {
      const validToken = generateToken(mockJWTPayload)
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: validToken }),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should return null when user is inactive', async () => {
      const validToken = generateToken(mockJWTPayload)
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: validToken }),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any)

      const result = await getSession()

      expect(result).toBeNull()
    })

    it('should return user when token is valid and user is active', async () => {
      const validToken = generateToken(mockJWTPayload)
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: validToken }),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await getSession()

      expect(result).not.toBeNull()
      expect(result?.id).toBe(mockUser.id)
      expect(result?.email).toBe(mockUser.email)
    })
  })

  describe('authenticate', () => {
    beforeEach(async () => {
      // Set up a properly hashed password for tests
      mockUser.passwordHash = await bcrypt.hash('correctPassword123!', 10)
    })

    it('should return null for non-existent user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

      const result = await authenticate('nonexistent@example.com', 'password')

      expect(result).toBeNull()
    })

    it('should return null for inactive user', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any)

      const result = await authenticate(mockUser.email, 'correctPassword123!')

      expect(result).toBeNull()
    })

    it('should return null for incorrect password', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await authenticate(mockUser.email, 'wrongPassword')

      expect(result).toBeNull()
    })

    it('should return user and update lastLoginAt for correct credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser as any)

      const result = await authenticate(mockUser.email, 'correctPassword123!')

      expect(result).not.toBeNull()
      expect(result?.id).toBe(mockUser.id)
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      })
    })
  })

  describe('requireAuth', () => {
    it('should throw error when no session exists', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      await expect(requireAuth()).rejects.toThrow('Unauthorized')
    })

    it('should return user when session exists', async () => {
      const validToken = generateToken(mockJWTPayload)
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: validToken }),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any)

      const result = await requireAuth()

      expect(result).not.toBeNull()
      expect(result.id).toBe(mockUser.id)
    })
  })

  describe('setAuthCookie', () => {
    it('should set auth cookie with correct options', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      await setAuthCookie('test-token')

      expect(mockCookieStore.set).toHaveBeenCalledWith('auth_token', 'test-token', {
        httpOnly: true,
        secure: false, // NODE_ENV is 'test'
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })
    })

    it('should call cookies() to get cookie store', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      await setAuthCookie('any-token')

      expect(cookies).toHaveBeenCalled()
    })
  })

  describe('clearAuthCookie', () => {
    it('should delete auth_token cookie', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      await clearAuthCookie()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('auth_token')
    })

    it('should call cookies() to get cookie store', async () => {
      const mockCookieStore = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      }
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

      await clearAuthCookie()

      expect(cookies).toHaveBeenCalled()
    })
  })
})
