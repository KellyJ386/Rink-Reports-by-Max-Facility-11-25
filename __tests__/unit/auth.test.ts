/**
 * Unit tests for authentication utilities
 * @file __tests__/unit/auth.test.ts
 */

import { hashPassword, verifyPassword, generateToken, verifyToken } from '@/lib/auth'

describe('Authentication Utilities', () => {
  describe('Password Hashing', () => {
    const testPassword = 'testPassword123!'

    it('should hash a password', async () => {
      const hashedPassword = await hashPassword(testPassword)

      expect(hashedPassword).toBeDefined()
      expect(hashedPassword).not.toBe(testPassword)
      expect(hashedPassword.length).toBeGreaterThan(0)
    })

    it('should generate different hashes for the same password', async () => {
      const hash1 = await hashPassword(testPassword)
      const hash2 = await hashPassword(testPassword)

      // Bcrypt generates unique salts, so hashes should differ
      expect(hash1).not.toBe(hash2)
    })

    it('should verify correct password', async () => {
      const hashedPassword = await hashPassword(testPassword)
      const isValid = await verifyPassword(testPassword, hashedPassword)

      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', async () => {
      const hashedPassword = await hashPassword(testPassword)
      const isValid = await verifyPassword('wrongPassword', hashedPassword)

      expect(isValid).toBe(false)
    })

    it('should reject empty password', async () => {
      const hashedPassword = await hashPassword(testPassword)
      const isValid = await verifyPassword('', hashedPassword)

      expect(isValid).toBe(false)
    })
  })

  describe('JWT Token Generation', () => {
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'Staff',
    }

    it('should generate a valid JWT token', () => {
      const token = generateToken(testPayload)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate different tokens for different payloads', () => {
      const token1 = generateToken(testPayload)
      const token2 = generateToken({ ...testPayload, userId: 'different-id' })

      expect(token1).not.toBe(token2)
    })
  })

  describe('JWT Token Verification', () => {
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
      role: 'Staff',
    }

    it('should verify a valid token', () => {
      const token = generateToken(testPayload)
      const decoded = verifyToken(token)

      expect(decoded).toBeDefined()
      expect(decoded?.userId).toBe(testPayload.userId)
      expect(decoded?.email).toBe(testPayload.email)
      expect(decoded?.role).toBe(testPayload.role)
    })

    it('should return null for invalid token', () => {
      const decoded = verifyToken('invalid-token')

      expect(decoded).toBeNull()
    })

    it('should return null for empty token', () => {
      const decoded = verifyToken('')

      expect(decoded).toBeNull()
    })

    it('should return null for malformed token', () => {
      const decoded = verifyToken('not.a.valid.jwt.token')

      expect(decoded).toBeNull()
    })
  })
})
