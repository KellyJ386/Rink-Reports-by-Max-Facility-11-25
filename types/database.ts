// Database model types - mirrors Prisma schema
// These are used when Prisma client types aren't generated

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

export interface Role {
  id: string
  name: string
  description: string | null
  permissions: unknown // JSON field
  isSystemDefault: boolean
  facilityId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  phone: string | null
  smsPreference: SMSPreference
  isActive: boolean
  facilityId: string
  roleId: string
  permissionOverrides: unknown | null
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
}

export interface Rink {
  id: string
  facilityId: string
  name: string
  dimensions: string | null
  surfaceType: string
  isActive: boolean
  createdAt: Date
  iceDepthConfig: unknown | null
}

export interface FormTemplate {
  id: string
  name: string
  description: string | null
  moduleType: ModuleType
  schema: unknown
  version: number
  isActive: boolean
  facilityId: string
  conditionalRules: unknown | null
  calculatedFields: unknown | null
  createdAt: Date
  updatedAt: Date
}

export interface Submission {
  id: string
  templateId: string
  data: unknown
  status: SubmissionStatus
  submittedAt: Date
  submittedById: string
  rinkId: string | null
  reviewedAt: Date | null
  reviewedById: string | null
  reviewNotes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface ShiftDefinition {
  id: string
  name: string
  startTime: string
  endTime: string
  daysOfWeek: number[]
  facilityId: string
  rinkId: string | null
  isActive: boolean
  createdAt: Date
}

export interface ScheduleEntry {
  id: string
  shiftId: string
  userId: string | null
  date: Date
  status: ScheduleStatus
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AuditLog {
  id: string
  action: AuditAction
  entityType: string
  entityId: string
  userId: string | null
  facilityId: string
  changes: unknown | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

// Enums
export type ModuleType =
  | 'ICE_DEPTH'
  | 'ICE_OPERATIONS'
  | 'REFRIGERATION'
  | 'AIR_QUALITY'
  | 'INCIDENT'
  | 'SCHEDULE'
  | 'DAILY_CHECKLIST'

export type SubmissionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'

export type ScheduleStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'FILLED'
  | 'CANCELLED'

export type SMSPreference =
  | 'ALL'
  | 'CRITICAL_ONLY'
  | 'NONE'

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'ARCHIVE'
  | 'APPROVE'
  | 'REJECT'
  | 'LOGIN'
  | 'LOGOUT'
