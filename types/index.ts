import type { User, Role, Facility, Rink } from './database'

export type { User, Role, Facility, Rink } from './database'
export * from './database'

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
