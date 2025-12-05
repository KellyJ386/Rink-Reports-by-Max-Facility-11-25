import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Maximum requests per window
  keyPrefix?: string    // Prefix for the key
}

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (use Redis in production for multi-instance)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 60000) // Clean every minute

export function getClientIdentifier(request: NextRequest): string {
  // Try to get the real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a hash of user agent + some request info
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return `ua-${hashCode(userAgent)}`
}

function hashCode(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

export function rateLimit(options: RateLimitOptions) {
  const { windowMs, maxRequests, keyPrefix = 'rl' } = options

  return async function rateLimitMiddleware(
    request: NextRequest,
    identifier?: string
  ): Promise<{ success: boolean; remaining: number; resetAt: number } | NextResponse> {
    const key = `${keyPrefix}:${identifier || getClientIdentifier(request)}`
    const now = Date.now()

    let entry = store.get(key)

    // Create new entry or reset if window has passed
    if (!entry || entry.resetAt < now) {
      entry = {
        count: 0,
        resetAt: now + windowMs,
      }
    }

    entry.count++
    store.set(key, entry)

    const remaining = Math.max(0, maxRequests - entry.count)

    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)

      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      )
    }

    return {
      success: true,
      remaining,
      resetAt: entry.resetAt,
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimit = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  keyPrefix: 'api',
})

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5,           // 5 login attempts
  keyPrefix: 'auth',
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20,          // 20 uploads
  keyPrefix: 'upload',
})

// Helper to add rate limit headers to response
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetAt: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(limit))
  response.headers.set('X-RateLimit-Remaining', String(remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
  return response
}
