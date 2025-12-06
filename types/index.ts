// Local type definitions to avoid dependency on generated Prisma client
// These will be replaced by Prisma types when prisma generate is run

interface User {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phone?: string | null
  phoneVerified: boolean
  smsOptIn: boolean
  smsPreference: string
  facilityId: string
  roleId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date | null
  permissionOverrides?: unknown
}

interface Role {
  id: string
  facilityId?: string | null
  name: string
  description?: string | null
  isSystemDefault: boolean
  permissions: unknown
}

interface Facility {
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
  email: string
  facilityId: string
  roleId: string
}

export interface AuthSession {
  user: UserWithRole
  token: string
}
