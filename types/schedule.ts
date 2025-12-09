import { z } from 'zod'
import {
  ScheduleEntry,
  ShiftDefinition,
  TimeOffRequest,
  ShiftSwapRequest,
  EmployeeAvailability,
  ScheduleTemplate,
  RecurringShift,
  SchedulePeriod,
  User,
  ScheduleStatus,
  TimeOffType,
  TimeOffStatus,
  SwapType,
  SwapStatus,
  AvailabilityPreference,
  SchedulePeriodStatus,
} from '@prisma/client'

// ==================== SHIFT DEFINITION TYPES ====================

export type ShiftDefinitionWithRelations = ShiftDefinition & {
  scheduleEntries?: ScheduleEntry[]
  recurringShifts?: RecurringShift[]
}

export const createShiftDefinitionSchema = z.object({
  name: z.string().min(1, 'Shift name is required').max(100),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  breakMinutes: z.number().min(0).max(480).default(0),
  minEmployees: z.number().min(1).max(50).default(1),
  maxEmployees: z.number().min(1).max(300).optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  rinkId: z.string().optional().nullable(),
})

export const updateShiftDefinitionSchema = createShiftDefinitionSchema.partial()

export type CreateShiftDefinitionInput = z.infer<typeof createShiftDefinitionSchema>
export type UpdateShiftDefinitionInput = z.infer<typeof updateShiftDefinitionSchema>

// ==================== SCHEDULE ENTRY TYPES ====================

export type ScheduleEntryWithRelations = ScheduleEntry & {
  user?: User | null
  shift?: ShiftDefinition | null
  swapRequests?: ShiftSwapRequest[]
}

export type ScheduleEntryWithUser = ScheduleEntry & {
  user: (User & { role: { name: string } }) | null
  shift: ShiftDefinition | null
}

export const createScheduleEntrySchema = z.object({
  userId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
  rinkId: z.string().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  breakMinutes: z.number().min(0).max(480).default(0),
  notes: z.string().max(500).optional().nullable(),
  isOpenShift: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
})

export const updateScheduleEntrySchema = createScheduleEntrySchema.partial()

export const bulkCreateScheduleEntriesSchema = z.object({
  entries: z.array(createScheduleEntrySchema).min(1).max(500),
})

export type CreateScheduleEntryInput = z.infer<typeof createScheduleEntrySchema>
export type UpdateScheduleEntryInput = z.infer<typeof updateScheduleEntrySchema>
export type BulkCreateScheduleEntriesInput = z.infer<typeof bulkCreateScheduleEntriesSchema>

// ==================== TIME OFF REQUEST TYPES ====================

export type TimeOffRequestWithRelations = TimeOffRequest & {
  user: User
  reviewedBy?: User | null
}

export const createTimeOffRequestSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  requestType: z.nativeEnum(TimeOffType),
  reason: z.string().max(1000).optional().nullable(),
  hoursRequested: z.number().min(0).optional().nullable(),
})

export const reviewTimeOffRequestSchema = z.object({
  status: z.enum(['APPROVED', 'DENIED']),
  reviewNotes: z.string().max(1000).optional().nullable(),
  hoursPaid: z.number().min(0).optional().nullable(),
})

export type CreateTimeOffRequestInput = z.infer<typeof createTimeOffRequestSchema>
export type ReviewTimeOffRequestInput = z.infer<typeof reviewTimeOffRequestSchema>

// ==================== SHIFT SWAP REQUEST TYPES ====================

export type ShiftSwapRequestWithRelations = ShiftSwapRequest & {
  requester: User
  originalShift: ScheduleEntry & { user?: User | null }
  targetShift?: (ScheduleEntry & { user?: User | null }) | null
  targetUser?: User | null
  managerApprovedBy?: User | null
}

export const createShiftSwapRequestSchema = z.object({
  originalShiftId: z.string().min(1, 'Original shift is required'),
  targetShiftId: z.string().optional().nullable(),
  targetUserId: z.string().optional().nullable(),
  swapType: z.nativeEnum(SwapType),
  reason: z.string().max(1000).optional().nullable(),
})

export const respondToSwapRequestSchema = z.object({
  accept: z.boolean(),
  notes: z.string().max(1000).optional().nullable(),
})

export const managerReviewSwapRequestSchema = z.object({
  approve: z.boolean(),
  notes: z.string().max(1000).optional().nullable(),
})

export type CreateShiftSwapRequestInput = z.infer<typeof createShiftSwapRequestSchema>
export type RespondToSwapRequestInput = z.infer<typeof respondToSwapRequestSchema>
export type ManagerReviewSwapRequestInput = z.infer<typeof managerReviewSwapRequestSchema>

// ==================== EMPLOYEE AVAILABILITY TYPES ====================

export type EmployeeAvailabilityWithUser = EmployeeAvailability & {
  user: User
}

export const createEmployeeAvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  isAvailable: z.boolean().default(true),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  preferenceLevel: z.nativeEnum(AvailabilityPreference).default(AvailabilityPreference.AVAILABLE),
  notes: z.string().max(500).optional().nullable(),
})

export const updateEmployeeAvailabilitySchema = createEmployeeAvailabilitySchema.partial()

export const bulkUpdateAvailabilitySchema = z.object({
  availability: z.array(z.object({
    id: z.string().optional(),
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
    isAvailable: z.boolean(),
    preferenceLevel: z.nativeEnum(AvailabilityPreference),
    notes: z.string().optional().nullable(),
  })),
})

export type CreateEmployeeAvailabilityInput = z.infer<typeof createEmployeeAvailabilitySchema>
export type UpdateEmployeeAvailabilityInput = z.infer<typeof updateEmployeeAvailabilitySchema>
export type BulkUpdateAvailabilityInput = z.infer<typeof bulkUpdateAvailabilitySchema>

// ==================== SCHEDULE TEMPLATE TYPES ====================

export type ScheduleTemplateWithRelations = ScheduleTemplate & {
  recurringShifts?: RecurringShift[]
}

export interface TemplateShiftConfig {
  dayOfWeek: number
  shiftId: string
  userId?: string | null
  minStaff: number
  maxStaff?: number | null
  notes?: string | null
}

export const templateShiftConfigSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  shiftId: z.string().min(1),
  userId: z.string().optional().nullable(),
  minStaff: z.number().min(1).default(1),
  maxStaff: z.number().min(1).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const createScheduleTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  templateData: z.array(templateShiftConfigSchema).min(1, 'At least one shift configuration is required'),
})

export const updateScheduleTemplateSchema = createScheduleTemplateSchema.partial()

export type CreateScheduleTemplateInput = z.infer<typeof createScheduleTemplateSchema>
export type UpdateScheduleTemplateInput = z.infer<typeof updateScheduleTemplateSchema>

// ==================== RECURRING SHIFT TYPES ====================

export type RecurringShiftWithRelations = RecurringShift & {
  shift: ShiftDefinition
  user?: User | null
  template?: ScheduleTemplate | null
}

export const createRecurringShiftSchema = z.object({
  templateId: z.string().optional().nullable(),
  shiftId: z.string().min(1, 'Shift definition is required'),
  userId: z.string().optional().nullable(),
  dayOfWeek: z.number().min(0).max(6),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
})

export const updateRecurringShiftSchema = createRecurringShiftSchema.partial()

export type CreateRecurringShiftInput = z.infer<typeof createRecurringShiftSchema>
export type UpdateRecurringShiftInput = z.infer<typeof updateRecurringShiftSchema>

// ==================== SCHEDULE PERIOD TYPES ====================

export type SchedulePeriodWithStats = SchedulePeriod & {
  totalShifts?: number
  filledShifts?: number
  openShifts?: number
}

export const createSchedulePeriodSchema = z.object({
  name: z.string().min(1, 'Period name is required').max(100),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  notes: z.string().max(1000).optional().nullable(),
})

export const updateSchedulePeriodSchema = createSchedulePeriodSchema.partial()

export const publishSchedulePeriodSchema = z.object({
  notifyEmployees: z.boolean().default(true),
  sendEmail: z.boolean().default(true),
  sendSms: z.boolean().default(false),
})

export type CreateSchedulePeriodInput = z.infer<typeof createSchedulePeriodSchema>
export type UpdateSchedulePeriodInput = z.infer<typeof updateSchedulePeriodSchema>
export type PublishSchedulePeriodInput = z.infer<typeof publishSchedulePeriodSchema>

// ==================== CALENDAR VIEW TYPES ====================

export interface CalendarDay {
  date: string
  dayOfWeek: number
  isToday: boolean
  isCurrentMonth: boolean
  entries: ScheduleEntryWithUser[]
  conflicts: ScheduleConflict[]
  timeOffRequests: TimeOffRequest[]
}

export interface CalendarWeek {
  weekNumber: number
  startDate: string
  endDate: string
  days: CalendarDay[]
}

export interface ScheduleCalendarData {
  month: number
  year: number
  weeks: CalendarWeek[]
  shifts: ShiftDefinition[]
  employees: EmployeeBasicInfo[]
  period?: SchedulePeriod | null
}

// ==================== CONFLICT DETECTION TYPES ====================

export interface ScheduleConflict {
  type: ConflictType
  severity: 'warning' | 'error'
  message: string
  affectedEntryIds: string[]
  affectedUserIds?: string[]
}

export type ConflictType =
  | 'DOUBLE_BOOKED'          // Employee scheduled for overlapping shifts
  | 'OVERTIME'               // Exceeds max hours per day/week
  | 'INSUFFICIENT_REST'      // Less than minimum rest between shifts
  | 'AVAILABILITY_CONFLICT'  // Scheduled outside employee's availability
  | 'TIME_OFF_CONFLICT'      // Scheduled during approved time off
  | 'UNDERSTAFFED'           // Below minimum staff for shift
  | 'OVERSTAFFED'            // Above maximum staff for shift
  | 'QUALIFICATION'          // Employee lacks required qualification/role

export const conflictSettingsSchema = z.object({
  minRestHours: z.number().min(0).max(24).default(8),
  maxHoursPerDay: z.number().min(1).max(24).default(12),
  maxHoursPerWeek: z.number().min(1).max(168).default(40),
  enableAvailabilityCheck: z.boolean().default(true),
  enableTimeOffCheck: z.boolean().default(true),
  enableOvertimeWarnings: z.boolean().default(true),
})

export type ConflictSettings = z.infer<typeof conflictSettingsSchema>

// ==================== EMPLOYEE INFO TYPES ====================

export interface EmployeeBasicInfo {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  role: {
    id: string
    name: string
  }
  isActive: boolean
}

export interface EmployeeScheduleSummary {
  userId: string
  user: EmployeeBasicInfo
  totalHours: number
  scheduledShifts: number
  pendingTimeOff: number
  approvedTimeOff: TimeOffRequest[]
  availability: EmployeeAvailability[]
}

// ==================== FILTER & QUERY TYPES ====================

export interface ScheduleQueryParams {
  startDate: string
  endDate: string
  userId?: string
  shiftId?: string
  rinkId?: string
  status?: ScheduleStatus
  isOpenShift?: boolean
}

export interface TimeOffQueryParams {
  startDate?: string
  endDate?: string
  userId?: string
  status?: TimeOffStatus
  requestType?: TimeOffType
}

export interface SwapQueryParams {
  status?: SwapStatus
  requesterId?: string
  targetUserId?: string
}

// ==================== EXPORT TYPES ====================

export interface ScheduleExportOptions {
  format: 'csv' | 'pdf' | 'xlsx'
  startDate: string
  endDate: string
  includeEmployeeDetails: boolean
  includeNotes: boolean
  groupBy: 'date' | 'employee' | 'shift'
}

export const scheduleExportOptionsSchema = z.object({
  format: z.enum(['csv', 'pdf', 'xlsx']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  includeEmployeeDetails: z.boolean().default(true),
  includeNotes: z.boolean().default(false),
  groupBy: z.enum(['date', 'employee', 'shift']).default('date'),
})

// ==================== DRAG AND DROP TYPES ====================

export interface DragItem {
  type: 'schedule-entry' | 'shift-template' | 'employee'
  id: string
  data: ScheduleEntry | ShiftDefinition | EmployeeBasicInfo
}

export interface DropTarget {
  date: string
  timeSlot?: string
  employeeId?: string
}

export interface DragDropResult {
  success: boolean
  entry?: ScheduleEntry
  conflicts?: ScheduleConflict[]
  error?: string
}

// ==================== NOTIFICATION PREFERENCES ====================

export interface ScheduleNotificationPreferences {
  schedulePublished: boolean
  shiftAssigned: boolean
  shiftRemoved: boolean
  shiftReminder: boolean
  reminderHoursBefore: number
  timeOffUpdates: boolean
  swapRequests: boolean
}

export const scheduleNotificationPreferencesSchema = z.object({
  schedulePublished: z.boolean().default(true),
  shiftAssigned: z.boolean().default(true),
  shiftRemoved: z.boolean().default(true),
  shiftReminder: z.boolean().default(true),
  reminderHoursBefore: z.number().min(1).max(72).default(24),
  timeOffUpdates: z.boolean().default(true),
  swapRequests: z.boolean().default(true),
})

// Re-export enums for convenience
export {
  ScheduleStatus,
  TimeOffType,
  TimeOffStatus,
  SwapType,
  SwapStatus,
  AvailabilityPreference,
  SchedulePeriodStatus,
}
