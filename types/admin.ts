// Admin Types and Interfaces
// Comprehensive type definitions for User, Role, Permission, and Audit systems

// ============================================
// PERMISSION SYSTEM
// ============================================

// Resource types that can be controlled
export type ResourceType =
  | 'USERS'
  | 'ROLES'
  | 'FACILITIES'
  | 'RINKS'
  | 'SCHEDULES'
  | 'SHIFTS'
  | 'INCIDENTS'
  | 'ICE_DEPTH'
  | 'ICE_OPERATIONS'
  | 'REFRIGERATION'
  | 'AIR_QUALITY'
  | 'CHECKLISTS'
  | 'REPORTS'
  | 'FORMS'
  | 'NOTIFICATIONS'
  | 'SETTINGS'
  | 'AUDIT_LOGS'
  | 'INTEGRATIONS'
  | 'BILLING'

// Actions that can be performed on resources
export type ActionType =
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'EXPORT'
  | 'IMPORT'
  | 'ASSIGN'
  | 'MANAGE'

// Permission definition
export interface Permission {
  id: string
  resource: ResourceType
  action: ActionType
  description: string
  category: PermissionCategory
  isSystem: boolean // System permissions can't be modified
}

export type PermissionCategory =
  | 'USER_MANAGEMENT'
  | 'FACILITY_MANAGEMENT'
  | 'SCHEDULE_MANAGEMENT'
  | 'REPORT_MANAGEMENT'
  | 'SYSTEM_ADMINISTRATION'

// Permission key format: RESOURCE:ACTION (e.g., "USERS:CREATE")
export type PermissionKey = `${ResourceType}:${ActionType}`

// All available permissions grouped by category
export const PERMISSIONS: Record<PermissionCategory, Permission[]> = {
  USER_MANAGEMENT: [
    { id: 'perm-1', resource: 'USERS', action: 'VIEW', description: 'View user list and profiles', category: 'USER_MANAGEMENT', isSystem: true },
    { id: 'perm-2', resource: 'USERS', action: 'CREATE', description: 'Create new users', category: 'USER_MANAGEMENT', isSystem: true },
    { id: 'perm-3', resource: 'USERS', action: 'EDIT', description: 'Edit user details', category: 'USER_MANAGEMENT', isSystem: true },
    { id: 'perm-4', resource: 'USERS', action: 'DELETE', description: 'Deactivate or delete users', category: 'USER_MANAGEMENT', isSystem: true },
    { id: 'perm-5', resource: 'USERS', action: 'MANAGE', description: 'Full user management access', category: 'USER_MANAGEMENT', isSystem: true },
    { id: 'perm-6', resource: 'ROLES', action: 'VIEW', description: 'View roles and permissions', category: 'USER_MANAGEMENT', isSystem: true },
    { id: 'perm-7', resource: 'ROLES', action: 'CREATE', description: 'Create custom roles', category: 'USER_MANAGEMENT', isSystem: true },
    { id: 'perm-8', resource: 'ROLES', action: 'EDIT', description: 'Modify role permissions', category: 'USER_MANAGEMENT', isSystem: true },
    { id: 'perm-9', resource: 'ROLES', action: 'DELETE', description: 'Delete custom roles', category: 'USER_MANAGEMENT', isSystem: true },
  ],
  FACILITY_MANAGEMENT: [
    { id: 'perm-10', resource: 'FACILITIES', action: 'VIEW', description: 'View facility information', category: 'FACILITY_MANAGEMENT', isSystem: true },
    { id: 'perm-11', resource: 'FACILITIES', action: 'EDIT', description: 'Edit facility settings', category: 'FACILITY_MANAGEMENT', isSystem: true },
    { id: 'perm-12', resource: 'FACILITIES', action: 'MANAGE', description: 'Full facility management', category: 'FACILITY_MANAGEMENT', isSystem: true },
    { id: 'perm-13', resource: 'RINKS', action: 'VIEW', description: 'View rink information', category: 'FACILITY_MANAGEMENT', isSystem: true },
    { id: 'perm-14', resource: 'RINKS', action: 'CREATE', description: 'Add new rinks', category: 'FACILITY_MANAGEMENT', isSystem: true },
    { id: 'perm-15', resource: 'RINKS', action: 'EDIT', description: 'Edit rink details', category: 'FACILITY_MANAGEMENT', isSystem: true },
    { id: 'perm-16', resource: 'RINKS', action: 'DELETE', description: 'Remove rinks', category: 'FACILITY_MANAGEMENT', isSystem: true },
    { id: 'perm-17', resource: 'SETTINGS', action: 'VIEW', description: 'View system settings', category: 'FACILITY_MANAGEMENT', isSystem: true },
    { id: 'perm-18', resource: 'SETTINGS', action: 'EDIT', description: 'Modify system settings', category: 'FACILITY_MANAGEMENT', isSystem: true },
  ],
  SCHEDULE_MANAGEMENT: [
    { id: 'perm-19', resource: 'SCHEDULES', action: 'VIEW', description: 'View schedules', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-20', resource: 'SCHEDULES', action: 'CREATE', description: 'Create schedules', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-21', resource: 'SCHEDULES', action: 'EDIT', description: 'Edit schedules', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-22', resource: 'SCHEDULES', action: 'DELETE', description: 'Delete schedules', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-23', resource: 'SCHEDULES', action: 'PUBLISH', description: 'Publish schedules', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-24', resource: 'SHIFTS', action: 'VIEW', description: 'View shifts', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-25', resource: 'SHIFTS', action: 'CREATE', description: 'Create shifts', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-26', resource: 'SHIFTS', action: 'EDIT', description: 'Edit shifts', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-27', resource: 'SHIFTS', action: 'DELETE', description: 'Delete shifts', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-28', resource: 'SHIFTS', action: 'ASSIGN', description: 'Assign employees to shifts', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
    { id: 'perm-29', resource: 'SHIFTS', action: 'APPROVE', description: 'Approve shift swaps', category: 'SCHEDULE_MANAGEMENT', isSystem: true },
  ],
  REPORT_MANAGEMENT: [
    { id: 'perm-30', resource: 'INCIDENTS', action: 'VIEW', description: 'View incidents', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-31', resource: 'INCIDENTS', action: 'CREATE', description: 'Submit incidents', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-32', resource: 'INCIDENTS', action: 'EDIT', description: 'Edit incidents', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-33', resource: 'INCIDENTS', action: 'APPROVE', description: 'Approve incidents', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-34', resource: 'INCIDENTS', action: 'REJECT', description: 'Reject incidents', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-35', resource: 'ICE_DEPTH', action: 'VIEW', description: 'View ice depth readings', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-36', resource: 'ICE_DEPTH', action: 'CREATE', description: 'Submit ice depth readings', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-37', resource: 'AIR_QUALITY', action: 'VIEW', description: 'View air quality readings', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-38', resource: 'AIR_QUALITY', action: 'CREATE', description: 'Submit air quality readings', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-39', resource: 'REPORTS', action: 'VIEW', description: 'View all reports', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-40', resource: 'REPORTS', action: 'EXPORT', description: 'Export reports', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-41', resource: 'FORMS', action: 'VIEW', description: 'View form templates', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-42', resource: 'FORMS', action: 'CREATE', description: 'Create form templates', category: 'REPORT_MANAGEMENT', isSystem: true },
    { id: 'perm-43', resource: 'FORMS', action: 'EDIT', description: 'Edit form templates', category: 'REPORT_MANAGEMENT', isSystem: true },
  ],
  SYSTEM_ADMINISTRATION: [
    { id: 'perm-44', resource: 'AUDIT_LOGS', action: 'VIEW', description: 'View audit logs', category: 'SYSTEM_ADMINISTRATION', isSystem: true },
    { id: 'perm-45', resource: 'AUDIT_LOGS', action: 'EXPORT', description: 'Export audit logs', category: 'SYSTEM_ADMINISTRATION', isSystem: true },
    { id: 'perm-46', resource: 'INTEGRATIONS', action: 'VIEW', description: 'View integrations', category: 'SYSTEM_ADMINISTRATION', isSystem: true },
    { id: 'perm-47', resource: 'INTEGRATIONS', action: 'MANAGE', description: 'Manage integrations', category: 'SYSTEM_ADMINISTRATION', isSystem: true },
    { id: 'perm-48', resource: 'NOTIFICATIONS', action: 'MANAGE', description: 'Manage notification settings', category: 'SYSTEM_ADMINISTRATION', isSystem: true },
    { id: 'perm-49', resource: 'BILLING', action: 'VIEW', description: 'View billing information', category: 'SYSTEM_ADMINISTRATION', isSystem: true },
    { id: 'perm-50', resource: 'BILLING', action: 'MANAGE', description: 'Manage billing', category: 'SYSTEM_ADMINISTRATION', isSystem: true },
  ],
}

// Flatten permissions for easy lookup
export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS).flat()

// ============================================
// ROLE SYSTEM
// ============================================

export type RoleType = 'SYSTEM' | 'CUSTOM'

export interface Role {
  id: string
  name: string
  slug: string // URL-friendly name
  description: string
  type: RoleType
  permissions: PermissionKey[]
  isDefault: boolean // Assigned to new users
  userCount?: number
  color?: string
  icon?: string
  facilityId?: string // If role is facility-specific
  createdAt: string
  updatedAt: string
  createdBy?: string
}

// System roles (cannot be deleted)
export const SYSTEM_ROLES: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Full system access with all permissions',
    type: 'SYSTEM',
    permissions: ALL_PERMISSIONS.map((p) => `${p.resource}:${p.action}` as PermissionKey),
    isDefault: false,
    color: '#ef4444',
    icon: 'shield',
  },
  {
    name: 'Facility Manager',
    slug: 'facility-manager',
    description: 'Manages facility operations, staff, and reports',
    type: 'SYSTEM',
    permissions: [
      'USERS:VIEW', 'USERS:CREATE', 'USERS:EDIT',
      'FACILITIES:VIEW', 'FACILITIES:EDIT',
      'RINKS:VIEW', 'RINKS:CREATE', 'RINKS:EDIT',
      'SCHEDULES:VIEW', 'SCHEDULES:CREATE', 'SCHEDULES:EDIT', 'SCHEDULES:DELETE', 'SCHEDULES:PUBLISH',
      'SHIFTS:VIEW', 'SHIFTS:CREATE', 'SHIFTS:EDIT', 'SHIFTS:DELETE', 'SHIFTS:ASSIGN', 'SHIFTS:APPROVE',
      'INCIDENTS:VIEW', 'INCIDENTS:APPROVE', 'INCIDENTS:REJECT',
      'ICE_DEPTH:VIEW', 'AIR_QUALITY:VIEW',
      'REPORTS:VIEW', 'REPORTS:EXPORT',
      'SETTINGS:VIEW', 'SETTINGS:EDIT',
      'AUDIT_LOGS:VIEW',
    ] as PermissionKey[],
    isDefault: false,
    color: '#3b82f6',
    icon: 'building',
  },
  {
    name: 'Supervisor',
    slug: 'supervisor',
    description: 'Supervises daily operations and approves reports',
    type: 'SYSTEM',
    permissions: [
      'USERS:VIEW',
      'SCHEDULES:VIEW', 'SCHEDULES:CREATE', 'SCHEDULES:EDIT',
      'SHIFTS:VIEW', 'SHIFTS:CREATE', 'SHIFTS:EDIT', 'SHIFTS:ASSIGN', 'SHIFTS:APPROVE',
      'INCIDENTS:VIEW', 'INCIDENTS:CREATE', 'INCIDENTS:EDIT', 'INCIDENTS:APPROVE',
      'ICE_DEPTH:VIEW', 'ICE_DEPTH:CREATE',
      'AIR_QUALITY:VIEW', 'AIR_QUALITY:CREATE',
      'REPORTS:VIEW',
    ] as PermissionKey[],
    isDefault: false,
    color: '#8b5cf6',
    icon: 'user-check',
  },
  {
    name: 'Ice Technician',
    slug: 'ice-technician',
    description: 'Submits ice-related reports and views schedules',
    type: 'SYSTEM',
    permissions: [
      'SCHEDULES:VIEW',
      'SHIFTS:VIEW',
      'INCIDENTS:VIEW', 'INCIDENTS:CREATE',
      'ICE_DEPTH:VIEW', 'ICE_DEPTH:CREATE',
      'ICE_OPERATIONS:VIEW', 'ICE_OPERATIONS:CREATE',
      'REFRIGERATION:VIEW', 'REFRIGERATION:CREATE',
      'AIR_QUALITY:VIEW', 'AIR_QUALITY:CREATE',
      'CHECKLISTS:VIEW', 'CHECKLISTS:CREATE',
    ] as PermissionKey[],
    isDefault: true,
    color: '#06b6d4',
    icon: 'snowflake',
  },
  {
    name: 'Front Desk',
    slug: 'front-desk',
    description: 'Handles front desk operations and incident reporting',
    type: 'SYSTEM',
    permissions: [
      'SCHEDULES:VIEW',
      'SHIFTS:VIEW',
      'INCIDENTS:VIEW', 'INCIDENTS:CREATE',
      'CHECKLISTS:VIEW', 'CHECKLISTS:CREATE',
    ] as PermissionKey[],
    isDefault: false,
    color: '#22c55e',
    icon: 'desk',
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    description: 'Read-only access to schedules and reports',
    type: 'SYSTEM',
    permissions: [
      'SCHEDULES:VIEW',
      'SHIFTS:VIEW',
      'INCIDENTS:VIEW',
      'ICE_DEPTH:VIEW',
      'AIR_QUALITY:VIEW',
      'REPORTS:VIEW',
    ] as PermissionKey[],
    isDefault: false,
    color: '#6b7280',
    icon: 'eye',
  },
]

// ============================================
// USER SYSTEM
// ============================================

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'LOCKED'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  status: UserStatus
  emailVerified: boolean
  phoneVerified: boolean

  // Role and permissions
  roleId: string
  role?: Role
  permissionOverrides?: PermissionOverride[] // User-specific permission changes

  // Facility assignment
  facilityIds: string[]
  primaryFacilityId?: string

  // Employment
  employeeId?: string
  jobTitle?: string
  department?: string
  hireDate?: string

  // Authentication
  lastLoginAt?: string
  lastLoginIp?: string
  failedLoginAttempts: number
  lockedUntil?: string
  passwordChangedAt?: string
  requirePasswordChange: boolean
  twoFactorEnabled: boolean

  // Preferences
  timezone?: string
  locale?: string

  // Metadata
  invitedBy?: string
  invitedAt?: string
  activatedAt?: string
  notes?: string
  tags?: string[]

  createdAt: string
  updatedAt: string
}

// Permission override for specific users
export interface PermissionOverride {
  permission: PermissionKey
  granted: boolean // true = explicitly granted, false = explicitly denied
  reason?: string
  grantedBy: string
  grantedAt: string
  expiresAt?: string
}

// User with computed fields
export interface UserWithDetails extends User {
  role: Role
  facilities: Facility[]
  effectivePermissions: PermissionKey[]
}

// ============================================
// USER INVITATION
// ============================================

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED'

export interface UserInvitation {
  id: string
  email: string
  firstName?: string
  lastName?: string
  roleId: string
  facilityIds: string[]
  status: InvitationStatus
  token: string
  message?: string
  invitedBy: string
  invitedAt: string
  expiresAt: string
  acceptedAt?: string
  userId?: string // Set when invitation is accepted
}

// ============================================
// FACILITY SETTINGS
// ============================================

export interface Facility {
  id: string
  name: string
  slug: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone?: string
  email?: string
  website?: string
  timezone: string
  logo?: string

  // Status
  isActive: boolean

  // Counts
  userCount?: number
  rinkCount?: number

  createdAt: string
  updatedAt: string
}

export interface FacilitySettings {
  id: string
  facilityId: string

  // General settings
  operatingHours: {
    [day: string]: { open: string; close: string; closed?: boolean }
  }

  // Air quality thresholds
  airQualityThresholds: {
    co: { warning: number; critical: number; evacuation: number }
    no2: { warning: number; critical: number; evacuation: number }
  }

  // Ice depth settings
  iceDepthSettings: {
    targetDepth: number // inches
    minDepth: number
    maxDepth: number
    measurementFrequency: 'DAILY' | 'SHIFT' | 'CUSTOM'
    defaultGridType: '25' | '35' | '47' | 'CUSTOM'
  }

  // Scheduling settings
  schedulingSettings: {
    defaultShiftDuration: number // hours
    minShiftDuration: number
    maxShiftDuration: number
    overtimeThreshold: number // hours per week
    advanceSchedulingDays: number
    autoPublishEnabled: boolean
    swapRequiresApproval: boolean
  }

  // Notification settings
  notificationSettings: {
    airQualityAlertRecipients: string[] // user IDs
    incidentAlertRecipients: string[]
    schedulePublishRecipients: string[]
    emergencyContactNumbers: string[]
    quietHoursStart: string
    quietHoursEnd: string
    smsEnabled: boolean
    emailEnabled: boolean
  }

  // Data retention
  dataRetention: {
    incidentRetentionDays: number
    reportRetentionDays: number
    auditLogRetentionDays: number
    scheduleArchiveDays: number
  }

  // Integrations
  integrations: {
    weatherApiEnabled: boolean
    weatherApiKey?: string
    smsProvider?: 'twilio' | 'vonage'
    smsApiKey?: string
    emailProvider?: 'resend' | 'sendgrid'
    emailApiKey?: string
  }

  // Custom fields
  customFields?: Record<string, unknown>

  updatedAt: string
  updatedBy: string
}

// ============================================
// AUDIT LOG SYSTEM
// ============================================

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'PERMISSION_CHANGE'
  | 'ROLE_CHANGE'
  | 'STATUS_CHANGE'
  | 'APPROVE'
  | 'REJECT'
  | 'PUBLISH'
  | 'ARCHIVE'
  | 'EXPORT'
  | 'IMPORT'
  | 'INVITE'
  | 'ACTIVATE'
  | 'DEACTIVATE'
  | 'LOCK'
  | 'UNLOCK'
  | 'SETTING_CHANGE'

export type AuditSeverity = 'INFO' | 'WARNING' | 'CRITICAL'

export interface AuditLog {
  id: string
  timestamp: string

  // Actor
  userId: string
  userName: string
  userEmail: string
  userRole: string

  // Action
  action: AuditAction
  severity: AuditSeverity

  // Target
  resourceType: ResourceType | 'SESSION' | 'SYSTEM'
  resourceId?: string
  resourceName?: string

  // Context
  facilityId?: string
  facilityName?: string

  // Details
  description: string
  changes?: AuditChange[]
  metadata?: Record<string, unknown>

  // Request info
  ipAddress?: string
  userAgent?: string
  requestId?: string
}

export interface AuditChange {
  field: string
  oldValue: unknown
  newValue: unknown
}

export interface AuditLogFilters {
  userId?: string
  action?: AuditAction
  resourceType?: ResourceType | 'SESSION' | 'SYSTEM'
  resourceId?: string
  facilityId?: string
  severity?: AuditSeverity
  startDate?: string
  endDate?: string
  searchQuery?: string
}

export interface AuditLogStats {
  total: number
  byAction: Record<AuditAction, number>
  bySeverity: Record<AuditSeverity, number>
  byResource: Record<string, number>
  recentActivity: { date: string; count: number }[]
}

// ============================================
// API TYPES
// ============================================

export interface CreateUserInput {
  email: string
  firstName: string
  lastName: string
  phone?: string
  roleId: string
  facilityIds: string[]
  primaryFacilityId?: string
  jobTitle?: string
  department?: string
  sendInvitation?: boolean
  temporaryPassword?: string
}

export interface UpdateUserInput {
  firstName?: string
  lastName?: string
  phone?: string
  roleId?: string
  facilityIds?: string[]
  primaryFacilityId?: string
  jobTitle?: string
  department?: string
  status?: UserStatus
  notes?: string
  tags?: string[]
}

export interface CreateRoleInput {
  name: string
  description: string
  permissions: PermissionKey[]
  color?: string
  icon?: string
  facilityId?: string
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: PermissionKey[]
  color?: string
  icon?: string
}

export interface InviteUserInput {
  email: string
  firstName?: string
  lastName?: string
  roleId: string
  facilityIds: string[]
  message?: string
}

export interface BulkUserAction {
  userIds: string[]
  action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE' | 'CHANGE_ROLE' | 'ADD_TO_FACILITY' | 'REMOVE_FROM_FACILITY'
  params?: {
    roleId?: string
    facilityId?: string
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  user: User | UserWithDetails,
  permission: PermissionKey,
  role?: Role
): boolean {
  // Check permission overrides first
  if (user.permissionOverrides) {
    const override = user.permissionOverrides.find((o) => o.permission === permission)
    if (override) {
      // Check if override has expired
      if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
        // Override expired, fall through to role check
      } else {
        return override.granted
      }
    }
  }

  // Check role permissions
  const userRole = 'role' in user && user.role ? user.role : role
  if (userRole) {
    return userRole.permissions.includes(permission)
  }

  return false
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(
  user: User | UserWithDetails,
  permissions: PermissionKey[],
  role?: Role
): boolean {
  return permissions.some((p) => hasPermission(user, p, role))
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(
  user: User | UserWithDetails,
  permissions: PermissionKey[],
  role?: Role
): boolean {
  return permissions.every((p) => hasPermission(user, p, role))
}

/**
 * Get effective permissions for a user (role + overrides)
 */
export function getEffectivePermissions(user: User, role: Role): PermissionKey[] {
  const permissions = new Set<PermissionKey>(role.permissions)

  // Apply overrides
  if (user.permissionOverrides) {
    user.permissionOverrides.forEach((override) => {
      // Skip expired overrides
      if (override.expiresAt && new Date(override.expiresAt) < new Date()) {
        return
      }

      if (override.granted) {
        permissions.add(override.permission)
      } else {
        permissions.delete(override.permission)
      }
    })
  }

  return Array.from(permissions)
}

/**
 * Format permission key for display
 */
export function formatPermissionKey(key: PermissionKey): string {
  const [resource, action] = key.split(':')
  return `${resource.replace(/_/g, ' ')} - ${action}`
}

/**
 * Get permission by key
 */
export function getPermissionByKey(key: PermissionKey): Permission | undefined {
  const [resource, action] = key.split(':') as [ResourceType, ActionType]
  return ALL_PERMISSIONS.find((p) => p.resource === resource && p.action === action)
}
