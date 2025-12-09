/**
 * Prisma type stubs for build compatibility
 * These types mirror the Prisma schema and are used when Prisma client isn't generated
 * Note: In production, use `npx prisma generate` to get proper types
 */

export interface User {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phone: string | null
  phoneVerified: boolean
  smsOptIn: boolean
  smsPreference: 'ALL' | 'CRITICAL_ONLY' | 'NONE'
  facilityId: string
  roleId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  permissionOverrides: Record<string, unknown> | null
}

export interface Role {
  id: string
  facilityId: string | null
  name: string
  description: string | null
  isSystemDefault: boolean
  permissions: Record<string, unknown>
}

export interface Facility {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface Rink {
  id: string
  facilityId: string
  name: string
  dimensions: string | null
  surfaceType: string
  isActive: boolean
  createdAt: Date
  iceDepthConfig: Record<string, unknown> | null
}
