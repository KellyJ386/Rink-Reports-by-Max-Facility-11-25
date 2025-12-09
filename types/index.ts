// Use local type stubs when Prisma client isn't generated
// Run `npx prisma generate` to get full Prisma types
import type { User, Role, Facility, Rink } from '@/lib/prisma-types'

export type { User, Role, Facility, Rink }

export type UserWithRole = User & {
  role: Role
  facility: Facility
}

export interface ModulePermissions {
  access: boolean
  submit?: boolean
  viewOwn?: boolean
  viewAll?: boolean
  edit?: boolean
  delete?: boolean
  export?: boolean
  approve?: boolean
  createTemplates?: boolean
  create?: boolean
  publish?: boolean
  // Admin-specific permissions
  editForms?: boolean
  editUsers?: boolean
  editSettings?: boolean
  manageRoles?: boolean
  viewAuditLog?: boolean
}

export interface PermissionSet {
  admin: ModulePermissions
  iceDepth: ModulePermissions
  iceOperations: ModulePermissions
  refrigeration: ModulePermissions
  airQuality: ModulePermissions
  incidents: ModulePermissions
  schedule: ModulePermissions
  dailyChecklist: ModulePermissions
}

// Mock Prisma types until database is set up
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  facilityId: string
  roleId: string
  permissionOverrides?: Partial<PermissionSet>
  createdAt: Date
  updatedAt: Date
}

export interface Role {
  id: string
  name: string
  description?: string
  permissions: PermissionSet
  createdAt: Date
  updatedAt: Date
}

export interface Facility {
  id: string
  name: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  timezone: string
  createdAt: Date
  updatedAt: Date
}

export interface Rink {
  id: string
  name: string
  facilityId: string
  createdAt: Date
  updatedAt: Date
}

export type UserWithRole = User & {
  role: Role
  facility: Facility
}

export type ModuleType =
  | 'admin'
  | 'iceDepth'
  | 'iceOperations'
  | 'refrigeration'
  | 'airQuality'
  | 'incidents'
  | 'schedule'
  | 'dailyChecklist'

export interface JWTPayload {
  userId: string
}

export interface AuthSession {
  user: UserWithRole
  token: string
}

// Export form types
export * from './forms'
