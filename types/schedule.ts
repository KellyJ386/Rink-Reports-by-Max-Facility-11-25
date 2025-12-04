// Schedule Module Types
// Comprehensive type definitions for the scheduling system

// ============================================================================
// ENUMS
// ============================================================================

export type ShiftStatus = 'DRAFT' | 'PUBLISHED' | 'FILLED' | 'OPEN' | 'CANCELLED'
export type ScheduleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type SwapRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'
export type AvailabilityType = 'AVAILABLE' | 'UNAVAILABLE' | 'PREFERRED' | 'IF_NEEDED'
export type RecurrencePattern = 'NONE' | 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
export type ShiftType = 'REGULAR' | 'OVERTIME' | 'ON_CALL' | 'TRAINING' | 'MEETING'

// ============================================================================
// SHIFT TEMPLATES
// ============================================================================

export interface ShiftTemplate {
  id: string
  facilityId: string
  name: string
  description?: string
  // Time configuration
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  breakDuration: number // minutes
  // Appearance
  color: string // hex color
  icon?: string
  // Requirements
  minStaff: number
  maxStaff: number
  requiredRoles: string[] // Role IDs
  preferredSkills?: string[]
  // Recurrence
  recurrencePattern: RecurrencePattern
  recurrenceDays?: number[] // 0-6 for days of week
  // Metadata
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateShiftTemplateInput {
  name: string
  description?: string
  startTime: string
  endTime: string
  breakDuration?: number
  color: string
  icon?: string
  minStaff?: number
  maxStaff?: number
  requiredRoles?: string[]
  preferredSkills?: string[]
  recurrencePattern?: RecurrencePattern
  recurrenceDays?: number[]
}

// ============================================================================
// SHIFTS
// ============================================================================

export interface Shift {
  id: string
  scheduleId: string
  facilityId: string
  rinkId?: string
  templateId?: string
  // Time
  date: string // YYYY-MM-DD
  startTime: string // HH:MM
  endTime: string // HH:MM
  breakDuration: number
  // Assignment
  assignedEmployees: ShiftAssignment[]
  minStaff: number
  maxStaff: number
  // Status
  status: ShiftStatus
  isOpen: boolean // Available for claiming
  // Appearance
  title: string
  description?: string
  color: string
  shiftType: ShiftType
  // Requirements
  requiredRoles: string[]
  notes?: string
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
  publishedAt?: string
}

export interface ShiftAssignment {
  id: string
  shiftId: string
  employeeId: string
  employee: {
    id: string
    firstName: string
    lastName: string
    email: string
    avatar?: string
    role: string
  }
  status: 'ASSIGNED' | 'CONFIRMED' | 'DECLINED' | 'NO_SHOW' | 'COMPLETED'
  assignedAt: string
  confirmedAt?: string
  checkInTime?: string
  checkOutTime?: string
  notes?: string
}

export interface CreateShiftInput {
  scheduleId: string
  templateId?: string
  rinkId?: string
  date: string
  startTime: string
  endTime: string
  breakDuration?: number
  title: string
  description?: string
  color?: string
  shiftType?: ShiftType
  minStaff?: number
  maxStaff?: number
  requiredRoles?: string[]
  assignedEmployeeIds?: string[]
  notes?: string
  isOpen?: boolean
}

export interface UpdateShiftInput {
  date?: string
  startTime?: string
  endTime?: string
  breakDuration?: number
  title?: string
  description?: string
  color?: string
  shiftType?: ShiftType
  minStaff?: number
  maxStaff?: number
  requiredRoles?: string[]
  notes?: string
  isOpen?: boolean
  status?: ShiftStatus
}

// ============================================================================
// SCHEDULES
// ============================================================================

export interface Schedule {
  id: string
  facilityId: string
  name: string
  description?: string
  // Period
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  // Status
  status: ScheduleStatus
  publishedAt?: string
  publishedBy?: string
  // Stats
  totalShifts: number
  filledShifts: number
  openShifts: number
  totalHours: number
  // Metadata
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface ScheduleWithShifts extends Schedule {
  shifts: Shift[]
}

export interface CreateScheduleInput {
  name: string
  description?: string
  startDate: string
  endDate: string
}

// ============================================================================
// EMPLOYEE AVAILABILITY
// ============================================================================

export interface Availability {
  id: string
  employeeId: string
  // Time range
  date: string // YYYY-MM-DD
  startTime?: string // HH:MM (null = all day)
  endTime?: string // HH:MM (null = all day)
  allDay: boolean
  // Type
  type: AvailabilityType
  // Recurrence
  isRecurring: boolean
  recurrencePattern?: RecurrencePattern
  recurrenceEndDate?: string
  // Details
  reason?: string
  notes?: string
  // Metadata
  createdAt: string
  updatedAt: string
}

export interface AvailabilityWithEmployee extends Availability {
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
}

export interface CreateAvailabilityInput {
  date: string
  startTime?: string
  endTime?: string
  allDay?: boolean
  type: AvailabilityType
  isRecurring?: boolean
  recurrencePattern?: RecurrencePattern
  recurrenceEndDate?: string
  reason?: string
  notes?: string
}

export interface WeeklyAvailability {
  employeeId: string
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  // Availability by day (0 = Sunday, 6 = Saturday)
  days: {
    [day: number]: {
      type: AvailabilityType
      slots: Array<{
        startTime: string
        endTime: string
        type: AvailabilityType
      }>
    }
  }
}

// ============================================================================
// SHIFT SWAP / TRADE REQUESTS
// ============================================================================

export interface ShiftSwapRequest {
  id: string
  facilityId: string
  // Requester
  requesterId: string
  requester: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  requesterShiftId: string
  requesterShift: Shift
  // Target (for trades)
  targetEmployeeId?: string
  targetEmployee?: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  targetShiftId?: string
  targetShift?: Shift
  // Type
  type: 'SWAP' | 'GIVEAWAY' | 'PICKUP'
  // Status
  status: SwapRequestStatus
  // Details
  reason?: string
  responseNote?: string
  // Approval
  requiresManagerApproval: boolean
  managerApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'
  managerId?: string
  managerNote?: string
  // Metadata
  createdAt: string
  updatedAt: string
  expiresAt: string
  respondedAt?: string
  completedAt?: string
}

export interface CreateSwapRequestInput {
  requesterShiftId: string
  targetEmployeeId?: string
  targetShiftId?: string
  type: 'SWAP' | 'GIVEAWAY' | 'PICKUP'
  reason?: string
}

// ============================================================================
// WAITLIST
// ============================================================================

export interface WaitlistEntry {
  id: string
  shiftId: string
  employeeId: string
  employee: {
    id: string
    firstName: string
    lastName: string
    avatar?: string
  }
  position: number
  status: 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  offeredAt?: string
  respondedAt?: string
  expiresAt?: string
  notes?: string
  createdAt: string
}

export interface CreateWaitlistEntryInput {
  shiftId: string
  notes?: string
}

// ============================================================================
// TIME OFF REQUESTS
// ============================================================================

export interface TimeOffRequest {
  id: string
  employeeId: string
  employee: {
    id: string
    firstName: string
    lastName: string
  }
  // Period
  startDate: string
  endDate: string
  // Type
  type: 'VACATION' | 'SICK' | 'PERSONAL' | 'BEREAVEMENT' | 'JURY_DUTY' | 'OTHER'
  // Status
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  // Details
  reason?: string
  notes?: string
  // Approval
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
  // Metadata
  createdAt: string
  updatedAt: string
}

export interface CreateTimeOffRequestInput {
  startDate: string
  endDate: string
  type: TimeOffRequest['type']
  reason?: string
  notes?: string
}

// ============================================================================
// CALENDAR VIEW TYPES
// ============================================================================

export type CalendarView = 'day' | 'week' | 'month' | 'timeline'

export interface CalendarDay {
  date: string // YYYY-MM-DD
  dayOfWeek: number // 0-6
  isToday: boolean
  isCurrentMonth: boolean
  isWeekend: boolean
  shifts: Shift[]
  availability?: AvailabilityType
}

export interface CalendarWeek {
  weekNumber: number
  startDate: string
  endDate: string
  days: CalendarDay[]
}

export interface CalendarMonth {
  year: number
  month: number // 1-12
  weeks: CalendarWeek[]
}

// ============================================================================
// SCHEDULE STATISTICS
// ============================================================================

export interface ScheduleStats {
  totalShifts: number
  filledShifts: number
  openShifts: number
  cancelledShifts: number
  totalHours: number
  // By status
  byStatus: {
    [key in ShiftStatus]: number
  }
  // By employee
  employeeHours: Array<{
    employeeId: string
    employeeName: string
    hours: number
    shifts: number
    overtime: number
  }>
  // Coverage
  coveragePercentage: number
  understaffedShifts: number
  // Conflicts
  conflicts: Array<{
    type: 'OVERLAP' | 'OVERTIME' | 'AVAILABILITY' | 'QUALIFICATION'
    shiftId: string
    employeeId: string
    message: string
  }>
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface ScheduleNotification {
  id: string
  type:
    | 'SHIFT_ASSIGNED'
    | 'SHIFT_CANCELLED'
    | 'SHIFT_MODIFIED'
    | 'SCHEDULE_PUBLISHED'
    | 'OPEN_SHIFT_AVAILABLE'
    | 'SWAP_REQUEST_RECEIVED'
    | 'SWAP_REQUEST_APPROVED'
    | 'SWAP_REQUEST_REJECTED'
    | 'WAITLIST_OFFERED'
    | 'TIME_OFF_APPROVED'
    | 'TIME_OFF_REJECTED'
    | 'REMINDER_24H'
    | 'REMINDER_1H'
  recipientId: string
  shiftId?: string
  swapRequestId?: string
  message: string
  read: boolean
  createdAt: string
}

// ============================================================================
// FILTERS AND SEARCH
// ============================================================================

export interface ScheduleFilters {
  facilityId?: string
  rinkId?: string
  startDate?: string
  endDate?: string
  status?: ScheduleStatus
  employeeId?: string
  shiftType?: ShiftType
  isOpen?: boolean
  search?: string
}

export interface ShiftFilters {
  scheduleId?: string
  date?: string
  startDate?: string
  endDate?: string
  status?: ShiftStatus
  employeeId?: string
  rinkId?: string
  shiftType?: ShiftType
  isOpen?: boolean
  templateId?: string
}

// ============================================================================
// DRAG AND DROP
// ============================================================================

export interface DragItem {
  type: 'SHIFT' | 'TEMPLATE' | 'EMPLOYEE'
  id: string
  data: Shift | ShiftTemplate | ShiftAssignment['employee']
}

export interface DropTarget {
  type: 'CALENDAR_CELL' | 'SHIFT' | 'TRASH'
  date?: string
  shiftId?: string
}

export interface DragDropResult {
  item: DragItem
  target: DropTarget
  action: 'MOVE' | 'COPY' | 'ASSIGN' | 'DELETE'
}

// ============================================================================
// PRESET COLORS
// ============================================================================

export const SHIFT_COLORS = {
  blue: '#3B82F6',
  green: '#22C55E',
  yellow: '#EAB308',
  orange: '#F97316',
  red: '#EF4444',
  purple: '#A855F7',
  pink: '#EC4899',
  teal: '#14B8A6',
  indigo: '#6366F1',
  gray: '#6B7280',
} as const

export const SHIFT_TYPE_COLORS: Record<ShiftType, string> = {
  REGULAR: SHIFT_COLORS.blue,
  OVERTIME: SHIFT_COLORS.orange,
  ON_CALL: SHIFT_COLORS.yellow,
  TRAINING: SHIFT_COLORS.purple,
  MEETING: SHIFT_COLORS.teal,
}

export const AVAILABILITY_COLORS: Record<AvailabilityType, string> = {
  AVAILABLE: '#22C55E',
  UNAVAILABLE: '#EF4444',
  PREFERRED: '#3B82F6',
  IF_NEEDED: '#EAB308',
}
