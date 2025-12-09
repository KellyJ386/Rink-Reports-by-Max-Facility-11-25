/**
 * Simple in-memory rate limiter for API routes
 * Note: For production, use Redis or similar persistent store
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  })
}, 60000) // Clean every minute

interface RateLimitOptions {
  windowMs?: number // Time window in milliseconds
  maxRequests?: number // Max requests per window
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const { windowMs = 60000, maxRequests = 10 } = options

  const now = Date.now()
  const key = identifier

  let entry = rateLimitStore.get(key)

  // If no entry or window has expired, create new entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + windowMs,
    }
    rateLimitStore.set(key, entry)
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: entry.resetTime,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  // Check if over limit
  if (entry.count > maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Login: 5 attempts per minute
  login: { windowMs: 60000, maxRequests: 5 },
  // Password reset: 3 attempts per minute
  passwordReset: { windowMs: 60000, maxRequests: 3 },
  // API general: 100 requests per minute
  api: { windowMs: 60000, maxRequests: 100 },
  // Admin actions: 30 per minute
  admin: { windowMs: 60000, maxRequests: 30 },
}

/**
 * Get client identifier for rate limiting
 * Uses IP address with optional user ID
 */
export function getRateLimitKey(
  ip: string,
  endpoint: string,
  userId?: string
): string {
  if (userId) {
    return `${endpoint}:${userId}:${ip}`
  }
  return `${endpoint}:${ip}`
}
