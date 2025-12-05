// Schedule Module Type Definitions

export type ScheduleStatus = 'DRAFT' | 'PUBLISHED' | 'FILLED' | 'CANCELLED'
export type TimeOffStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'CANCELLED'

// Shift Definition types
export interface ShiftDefinition {
  id: string
  facilityId: string
  rinkId: string | null
  name: string
  description: string | null
  startTime: string // "HH:MM" 24-hour format
  endTime: string
  color: string | null
  isActive: boolean
  minStaffRequired: number
  maxStaffAllowed: number
  createdAt: string
  updatedAt: string
}

export interface CreateShiftDefinitionRequest {
  rinkId?: string | null
  name: string
  description?: string
  startTime: string
  endTime: string
  color?: string
  minStaffRequired?: number
  maxStaffAllowed?: number
}

export interface UpdateShiftDefinitionRequest {
  name?: string
  description?: string
  startTime?: string
  endTime?: string
  color?: string
  isActive?: boolean
  minStaffRequired?: number
  maxStaffAllowed?: number
}

// Schedule Entry types
export interface ScheduleEntry {
  id: string
  facilityId: string
  userId: string | null
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  shiftId: string | null
  shift?: ShiftDefinition | null
  rinkId: string | null
  rink?: {
    id: string
    name: string
  } | null
  date: string // ISO date string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: ScheduleStatus
  notes: string | null
  waitlistUsers: string[] | null // Array of user IDs
  createdAt: string
  updatedAt: string
  createdById: string
  publishedAt: string | null
  publishedById: string | null
  claimedAt: string | null
  claimedById: string | null
}

export interface CreateScheduleEntryRequest {
  userId?: string | null
  shiftId?: string | null
  rinkId?: string | null
  date: string // YYYY-MM-DD
  startTime: string
  endTime: string
  isOpenShift?: boolean
  isEmergency?: boolean
  notes?: string
}

export interface UpdateScheduleEntryRequest {
  userId?: string | null
  shiftId?: string | null
  rinkId?: string | null
  date?: string
  startTime?: string
  endTime?: string
  isOpenShift?: boolean
  isEmergency?: boolean
  status?: ScheduleStatus
  notes?: string
}

// Employee Availability types
export interface EmployeeAvailability {
  id: string
  userId: string
  dayOfWeek: number // 0=Sunday, 6=Saturday
  startTime: string | null
  endTime: string | null
  isAvailable: boolean
  notes: string | null
}

export interface UpdateAvailabilityRequest {
  dayOfWeek: number
  startTime?: string | null
  endTime?: string | null
  isAvailable: boolean
  notes?: string
}

// Time-off Request types
export interface TimeOffRequest {
  id: string
  userId: string
  user?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  startDate: string
  endDate: string
  reason: string | null
  status: TimeOffStatus
  reviewedById: string | null
  reviewedAt: string | null
  reviewNotes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTimeOffRequest {
  startDate: string // YYYY-MM-DD
  endDate: string
  reason?: string
}

export interface ReviewTimeOffRequest {
  status: 'APPROVED' | 'DENIED'
  reviewNotes?: string
}

// Schedule View types
export interface DaySchedule {
  date: string
  entries: ScheduleEntry[]
  openShifts: number
  totalStaff: number
  gaps: ScheduleGap[]
}

export interface WeekSchedule {
  startDate: string
  endDate: string
  days: DaySchedule[]
}

export interface ScheduleGap {
  date: string
  startTime: string
  endTime: string
  shiftId?: string
  rinkId?: string
  requiredStaff: number
  currentStaff: number
}

export interface ScheduleConflict {
  type: 'overlap' | 'double_booking' | 'unavailable' | 'time_off'
  entryId: string
  conflictingEntryId?: string
  userId: string
  date: string
  message: string
}

// Filter types for queries
export interface ScheduleFilters {
  facilityId?: string
  userId?: string
  rinkId?: string
  shiftId?: string
  startDate?: string
  endDate?: string
  status?: ScheduleStatus | ScheduleStatus[]
  isOpenShift?: boolean
  isEmergency?: boolean
}

export interface ShiftFilters {
  facilityId?: string
  rinkId?: string
  isActive?: boolean
}

// Stats and summary types
export interface ScheduleStats {
  totalEntries: number
  publishedEntries: number
  draftEntries: number
  openShifts: number
  emergencyShifts: number
  filledShifts: number
  cancelledShifts: number
  uniqueEmployees: number
}

export interface EmployeeScheduleSummary {
  userId: string
  firstName: string
  lastName: string
  totalHours: number
  totalShifts: number
  upcomingShifts: number
  openShiftsClaimed: number
}

// Calendar view types
export interface CalendarDay {
  date: string
  dayOfWeek: number
  isCurrentMonth: boolean
  isToday: boolean
  entries: ScheduleEntry[]
  hasOpenShifts: boolean
  hasEmergencyShifts: boolean
  totalStaff: number
}

export interface CalendarWeek {
  weekNumber: number
  days: CalendarDay[]
}

export interface CalendarMonth {
  year: number
  month: number // 0-11
  weeks: CalendarWeek[]
}

// Notification types for schedule events
export interface ScheduleNotification {
  type: 'shift_assigned' | 'shift_changed' | 'shift_cancelled' | 'open_shift_available' | 'emergency_coverage' | 'schedule_published'
  recipientUserId: string
  scheduleEntryId?: string
  message: string
  sendSMS: boolean
  sendEmail: boolean
}

// Day of week helpers
export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' }
]

// Default shift colors
export const SHIFT_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' }
]

// Status display helpers
export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  FILLED: 'Filled',
  CANCELLED: 'Cancelled'
}

export const SCHEDULE_STATUS_COLORS: Record<ScheduleStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PUBLISHED: 'bg-blue-100 text-blue-700',
  FILLED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700'
}

export const TIME_OFF_STATUS_LABELS: Record<TimeOffStatus, string> = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  DENIED: 'Denied',
  CANCELLED: 'Cancelled'
}

export const TIME_OFF_STATUS_COLORS: Record<TimeOffStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  DENIED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-700'
}
