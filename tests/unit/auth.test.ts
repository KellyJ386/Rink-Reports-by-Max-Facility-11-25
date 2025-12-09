import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// We need to test the pure functions from auth without the Next.js dependencies
// So we'll create isolated versions for testing

const JWT_SECRET = 'test-jwt-secret-key-for-testing'
const JWT_EXPIRES_IN = '1h'

// Pure function implementations for testing
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

function generateToken(payload: { userId: string; email: string; facilityId: string; roleId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

function verifyToken(token: string): { userId: string; email: string; facilityId: string; roleId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string; facilityId: string; roleId: string }
  } catch (error) {
    return null
  }
}

describe('Authentication', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'mySecurePassword123'
      const hashed = await hashPassword(password)

      expect(hashed).toBeDefined()
      expect(hashed).not.toBe(password)
      expect(hashed.length).toBeGreaterThan(20)
    })

    it('should generate different hashes for the same password', async () => {
      const password = 'mySecurePassword123'
      const hash1 = await hashPassword(password)
      const hash2 = await hashPassword(password)

      expect(hash1).not.toBe(hash2)
    })

    it('should generate a bcrypt hash with correct format', async () => {
      const password = 'testPassword'
      const hashed = await hashPassword(password)

      // bcrypt hashes start with $2a$ or $2b$
      expect(hashed).toMatch(/^\$2[ab]\$/)
    })
  })

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctPassword123'
      const hashed = await hashPassword(password)

      const result = await verifyPassword(password, hashed)
      expect(result).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const password = 'correctPassword123'
      const wrongPassword = 'wrongPassword456'
      const hashed = await hashPassword(password)

      const result = await verifyPassword(wrongPassword, hashed)
      expect(result).toBe(false)
    })

    it('should return false for empty password', async () => {
      const password = 'somePassword'
      const hashed = await hashPassword(password)

      const result = await verifyPassword('', hashed)
      expect(result).toBe(false)
    })

    it('should handle special characters in password', async () => {
      const password = 'P@$$w0rd!#%^&*()'
      const hashed = await hashPassword(password)

      const result = await verifyPassword(password, hashed)
      expect(result).toBe(true)
    })

    it('should handle very long passwords', async () => {
      const password = 'a'.repeat(100)
      const hashed = await hashPassword(password)

      const result = await verifyPassword(password, hashed)
      expect(result).toBe(true)
    })
  })

  describe('generateToken', () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      facilityId: 'facility-456',
      roleId: 'role-789',
    }

    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should include payload in token', () => {
      const token = generateToken(mockPayload)
      const decoded = jwt.decode(token) as typeof mockPayload

      expect(decoded.userId).toBe(mockPayload.userId)
      expect(decoded.email).toBe(mockPayload.email)
      expect(decoded.facilityId).toBe(mockPayload.facilityId)
      expect(decoded.roleId).toBe(mockPayload.roleId)
    })

    it('should include expiration in token', () => {
      const token = generateToken(mockPayload)
      const decoded = jwt.decode(token) as { exp: number }

      expect(decoded.exp).toBeDefined()
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    })

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(mockPayload)
      const token2 = generateToken({ ...mockPayload, userId: 'user-different' })

      expect(token1).not.toBe(token2)
    })
  })

  describe('verifyToken', () => {
    const mockPayload = {
      userId: 'user-123',
      email: 'test@example.com',
      facilityId: 'facility-456',
      roleId: 'role-789',
    }

    it('should verify a valid token and return payload', () => {
      const token = generateToken(mockPayload)
      const result = verifyToken(token)

      expect(result).not.toBeNull()
      expect(result?.userId).toBe(mockPayload.userId)
      expect(result?.email).toBe(mockPayload.email)
      expect(result?.facilityId).toBe(mockPayload.facilityId)
      expect(result?.roleId).toBe(mockPayload.roleId)
    })

    it('should return null for invalid token', () => {
      const result = verifyToken('invalid.token.here')

      expect(result).toBeNull()
    })

    it('should return null for malformed token', () => {
      const result = verifyToken('not-even-a-jwt')

      expect(result).toBeNull()
    })

    it('should return null for empty token', () => {
      const result = verifyToken('')

      expect(result).toBeNull()
    })

    it('should return null for token signed with different secret', () => {
      const token = jwt.sign(mockPayload, 'different-secret', { expiresIn: '1h' })
      const result = verifyToken(token)

      expect(result).toBeNull()
    })

    it('should return null for expired token', () => {
      // Create an expired token
      const token = jwt.sign(mockPayload, JWT_SECRET, { expiresIn: '-1s' })
      const result = verifyToken(token)

      expect(result).toBeNull()
    })
  })

  describe('Password and Token Integration', () => {
    it('should complete full authentication flow', async () => {
      // 1. Hash password during registration
      const password = 'userPassword123'
      const hashedPassword = await hashPassword(password)

      // 2. Verify password during login
      const isValid = await verifyPassword(password, hashedPassword)
      expect(isValid).toBe(true)

      // 3. Generate token after successful login
      const payload = {
        userId: 'user-123',
        email: 'user@example.com',
        facilityId: 'facility-1',
        roleId: 'role-1',
      }
      const token = generateToken(payload)
      expect(token).toBeDefined()

      // 4. Verify token on subsequent requests
      const decoded = verifyToken(token)
      expect(decoded).not.toBeNull()
      expect(decoded?.userId).toBe(payload.userId)
    })

    it('should reject authentication with wrong password', async () => {
      const correctPassword = 'correctPassword'
      const wrongPassword = 'wrongPassword'
      const hashedPassword = await hashPassword(correctPassword)

      const isValid = await verifyPassword(wrongPassword, hashedPassword)
      expect(isValid).toBe(false)
    })
  })
})

describe('Security Tests', () => {
  it('should not expose password in token', () => {
    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      facilityId: 'facility-1',
      roleId: 'role-1',
    }
    const token = generateToken(payload)
    const decoded = jwt.decode(token) as Record<string, unknown>

    expect(decoded).not.toHaveProperty('password')
    expect(decoded).not.toHaveProperty('passwordHash')
  })

  it('should hash passwords with sufficient salt rounds', async () => {
    const password = 'testPassword'
    const hashed = await hashPassword(password)

    // bcrypt with 10 rounds takes noticeable time (security feature)
    // The hash format includes the salt rounds: $2a$10$...
    expect(hashed).toMatch(/^\$2[ab]\$10\$/)
  })

  it('should generate tokens that expire', () => {
    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      facilityId: 'facility-1',
      roleId: 'role-1',
    }
    const token = generateToken(payload)
    const decoded = jwt.decode(token) as { exp: number; iat: number }

    // Token should expire after iat
    expect(decoded.exp).toBeGreaterThan(decoded.iat)
  })
})
