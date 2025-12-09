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
