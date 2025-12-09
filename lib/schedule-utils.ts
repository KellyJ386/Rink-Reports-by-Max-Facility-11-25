// Schedule Utility Functions
// Helper functions for date manipulation, time calculations, and schedule operations

import type {
  Shift,
  ShiftTemplate,
  CalendarDay,
  CalendarWeek,
  CalendarMonth,
  ScheduleStats,
  ShiftStatus,
  AvailabilityType,
  Availability,
} from '@/types/schedule'

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Parse YYYY-MM-DD to Date
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get start of week (Sunday)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * Get end of week (Saturday)
 */
export function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date)
  d.setDate(d.getDate() + 6)
  d.setHours(23, 59, 59, 999)
  return d
}

/**
 * Get start of month
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

/**
 * Get end of month
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Get array of dates between start and end (inclusive)
 */
export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 1)
  }
  return dates
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Get week number of year
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

/**
 * Format date for display
 */
export function formatDateDisplay(date: Date | string, format: 'short' | 'medium' | 'long' = 'medium'): string {
  const d = typeof date === 'string' ? parseDate(date) : date
  const optionsMap: Record<'short' | 'medium' | 'long', Intl.DateTimeFormatOptions> = {
    short: { month: 'numeric', day: 'numeric' },
    medium: { month: 'short', day: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric' },
  }
  return d.toLocaleDateString('en-US', optionsMap[format])
}

/**
 * Get day name
 */
export function getDayName(dayOfWeek: number, format: 'short' | 'long' = 'short'): string {
  const days = {
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  }
  return days[format][dayOfWeek]
}

/**
 * Get month name
 */
export function getMonthName(month: number, format: 'short' | 'long' = 'long'): string {
  const months = {
    short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    long: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  }
  return months[format][month]
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Parse HH:MM to minutes since midnight
 */
export function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Format minutes since midnight to HH:MM
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Format time for display (12-hour format)
 */
export function formatTimeDisplay(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Calculate duration between two times in hours
 */
export function calculateDuration(startTime: string, endTime: string, breakMinutes: number = 0): number {
  let startMinutes = parseTime(startTime)
  let endMinutes = parseTime(endTime)

  // Handle overnight shifts
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60
  }

  const totalMinutes = endMinutes - startMinutes - breakMinutes
  return totalMinutes / 60
}

/**
 * Format duration for display
 */
export function formatDuration(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/**
 * Check if two time ranges overlap
 */
export function timesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = parseTime(start1)
  const e1 = parseTime(end1)
  const s2 = parseTime(start2)
  const e2 = parseTime(end2)

  return s1 < e2 && s2 < e1
}

/**
 * Get time slots for a day
 */
export function getTimeSlots(
  startHour: number = 0,
  endHour: number = 24,
  intervalMinutes: number = 60
): string[] {
  const slots: string[] = []
  for (let minutes = startHour * 60; minutes < endHour * 60; minutes += intervalMinutes) {
    slots.push(formatTime(minutes))
  }
  return slots
}

// ============================================================================
// CALENDAR GENERATION
// ============================================================================

/**
 * Generate calendar days for a month view
 */
export function generateCalendarMonth(year: number, month: number, shifts: Shift[] = []): CalendarMonth {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const weeks: CalendarWeek[] = []
  let currentWeek: CalendarDay[] = []

  // Start from the Sunday of the week containing the first day
  const startDate = getWeekStart(firstDay)
  // End on the Saturday of the week containing the last day
  const endDate = getWeekEnd(lastDay)

  let current = new Date(startDate)
  let weekNumber = getWeekNumber(current)

  while (current <= endDate) {
    const dateStr = formatDate(current)
    const dayShifts = shifts.filter(s => s.date === dateStr)

    currentWeek.push({
      date: dateStr,
      dayOfWeek: current.getDay(),
      isToday: isSameDay(current, today),
      isCurrentMonth: current.getMonth() === month - 1,
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
      shifts: dayShifts,
    })

    if (currentWeek.length === 7) {
      weeks.push({
        weekNumber,
        startDate: currentWeek[0].date,
        endDate: currentWeek[6].date,
        days: currentWeek,
      })
      currentWeek = []
      weekNumber++
    }

    current = addDays(current, 1)
  }

  return { year, month, weeks }
}

/**
 * Generate calendar week
 */
export function generateCalendarWeek(date: Date, shifts: Shift[] = []): CalendarWeek {
  const weekStart = getWeekStart(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: CalendarDay[] = []

  for (let i = 0; i < 7; i++) {
    const current = addDays(weekStart, i)
    const dateStr = formatDate(current)
    const dayShifts = shifts.filter(s => s.date === dateStr)

    days.push({
      date: dateStr,
      dayOfWeek: current.getDay(),
      isToday: isSameDay(current, today),
      isCurrentMonth: true,
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
      shifts: dayShifts,
    })
  }

  return {
    weekNumber: getWeekNumber(weekStart),
    startDate: days[0].date,
    endDate: days[6].date,
    days,
  }
}

// ============================================================================
// SHIFT UTILITIES
// ============================================================================

/**
 * Create shift from template
 */
export function createShiftFromTemplate(
  template: ShiftTemplate,
  date: string,
  scheduleId: string
): Omit<Shift, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> {
  return {
    scheduleId,
    facilityId: template.facilityId,
    templateId: template.id,
    date,
    startTime: template.startTime,
    endTime: template.endTime,
    breakDuration: template.breakDuration,
    title: template.name,
    description: template.description,
    color: template.color,
    shiftType: 'REGULAR',
    minStaff: template.minStaff,
    maxStaff: template.maxStaff,
    requiredRoles: template.requiredRoles,
    assignedEmployees: [],
    status: 'DRAFT',
    isOpen: false,
  }
}

/**
 * Calculate shift hours
 */
export function calculateShiftHours(shift: Shift): number {
  return calculateDuration(shift.startTime, shift.endTime, shift.breakDuration)
}

/**
 * Check if shift is understaffed
 */
export function isShiftUnderstaffed(shift: Shift): boolean {
  const assignedCount = shift.assignedEmployees.filter(
    a => a.status === 'ASSIGNED' || a.status === 'CONFIRMED'
  ).length
  return assignedCount < shift.minStaff
}

/**
 * Check if shift is fully staffed
 */
export function isShiftFullyStaffed(shift: Shift): boolean {
  const assignedCount = shift.assignedEmployees.filter(
    a => a.status === 'ASSIGNED' || a.status === 'CONFIRMED'
  ).length
  return assignedCount >= shift.maxStaff
}

/**
 * Get shift staffing status
 */
export function getShiftStaffingStatus(shift: Shift): 'understaffed' | 'adequate' | 'full' {
  if (isShiftUnderstaffed(shift)) return 'understaffed'
  if (isShiftFullyStaffed(shift)) return 'full'
  return 'adequate'
}

/**
 * Check for shift conflicts for an employee
 */
export function hasShiftConflict(
  newShift: { date: string; startTime: string; endTime: string },
  existingShifts: Shift[],
  employeeId: string
): Shift | null {
  for (const shift of existingShifts) {
    // Skip if not on the same date
    if (shift.date !== newShift.date) continue

    // Skip if employee is not assigned
    const isAssigned = shift.assignedEmployees.some(
      a => a.employeeId === employeeId && (a.status === 'ASSIGNED' || a.status === 'CONFIRMED')
    )
    if (!isAssigned) continue

    // Check for time overlap
    if (timesOverlap(newShift.startTime, newShift.endTime, shift.startTime, shift.endTime)) {
      return shift
    }
  }

  return null
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate schedule statistics
 */
export function calculateScheduleStats(shifts: Shift[]): ScheduleStats {
  const stats: ScheduleStats = {
    totalShifts: shifts.length,
    filledShifts: 0,
    openShifts: 0,
    cancelledShifts: 0,
    totalHours: 0,
    byStatus: {
      DRAFT: 0,
      PUBLISHED: 0,
      FILLED: 0,
      OPEN: 0,
      CANCELLED: 0,
    },
    employeeHours: [],
    coveragePercentage: 0,
    understaffedShifts: 0,
    conflicts: [],
  }

  const employeeHoursMap = new Map<string, { name: string; hours: number; shifts: number }>()

  for (const shift of shifts) {
    // Count by status
    stats.byStatus[shift.status]++

    if (shift.status === 'CANCELLED') {
      stats.cancelledShifts++
      continue
    }

    if (shift.isOpen) stats.openShifts++

    const hours = calculateShiftHours(shift)
    stats.totalHours += hours

    // Count employee hours
    const confirmedAssignments = shift.assignedEmployees.filter(
      a => a.status === 'ASSIGNED' || a.status === 'CONFIRMED'
    )

    if (confirmedAssignments.length > 0) {
      stats.filledShifts++
    }

    for (const assignment of confirmedAssignments) {
      const existing = employeeHoursMap.get(assignment.employeeId)
      if (existing) {
        existing.hours += hours
        existing.shifts++
      } else {
        employeeHoursMap.set(assignment.employeeId, {
          name: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
          hours,
          shifts: 1,
        })
      }
    }

    // Check for understaffing
    if (isShiftUnderstaffed(shift)) {
      stats.understaffedShifts++
    }
  }

  // Convert employee hours map to array
  stats.employeeHours = Array.from(employeeHoursMap.entries()).map(([id, data]) => ({
    employeeId: id,
    employeeName: data.name,
    hours: data.hours,
    shifts: data.shifts,
    overtime: Math.max(0, data.hours - 40), // Assuming 40h is regular
  }))

  // Calculate coverage
  const nonCancelledShifts = shifts.filter(s => s.status !== 'CANCELLED').length
  stats.coveragePercentage = nonCancelledShifts > 0
    ? Math.round((stats.filledShifts / nonCancelledShifts) * 100)
    : 0

  return stats
}

// ============================================================================
// AVAILABILITY UTILITIES
// ============================================================================

/**
 * Check if employee is available for a time slot
 */
export function isEmployeeAvailable(
  availability: Availability[],
  date: string,
  startTime: string,
  endTime: string
): { available: boolean; type?: AvailabilityType; reason?: string } {
  const dayAvailability = availability.filter(a => a.date === date)

  if (dayAvailability.length === 0) {
    // No availability set = available by default
    return { available: true }
  }

  for (const a of dayAvailability) {
    if (a.allDay) {
      // All-day availability/unavailability
      return {
        available: a.type !== 'UNAVAILABLE',
        type: a.type,
        reason: a.reason,
      }
    }

    // Check if the time slot overlaps with this availability entry
    if (a.startTime && a.endTime) {
      if (timesOverlap(startTime, endTime, a.startTime, a.endTime)) {
        return {
          available: a.type !== 'UNAVAILABLE',
          type: a.type,
          reason: a.reason,
        }
      }
    }
  }

  return { available: true }
}

/**
 * Get availability color class
 */
export function getAvailabilityColorClass(type: AvailabilityType): string {
  const colors: Record<AvailabilityType, string> = {
    AVAILABLE: 'bg-green-100 text-green-800 border-green-300',
    UNAVAILABLE: 'bg-red-100 text-red-800 border-red-300',
    PREFERRED: 'bg-blue-100 text-blue-800 border-blue-300',
    IF_NEEDED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  }
  return colors[type]
}

// ============================================================================
// SORTING AND FILTERING
// ============================================================================

/**
 * Sort shifts by date and time
 */
export function sortShiftsByDateTime(shifts: Shift[]): Shift[] {
  return [...shifts].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return parseTime(a.startTime) - parseTime(b.startTime)
  })
}

/**
 * Group shifts by date
 */
export function groupShiftsByDate(shifts: Shift[]): Map<string, Shift[]> {
  const grouped = new Map<string, Shift[]>()
  for (const shift of shifts) {
    const existing = grouped.get(shift.date) || []
    existing.push(shift)
    grouped.set(shift.date, existing)
  }
  return grouped
}

/**
 * Group shifts by employee
 */
export function groupShiftsByEmployee(shifts: Shift[]): Map<string, Shift[]> {
  const grouped = new Map<string, Shift[]>()
  for (const shift of shifts) {
    for (const assignment of shift.assignedEmployees) {
      if (assignment.status === 'ASSIGNED' || assignment.status === 'CONFIRMED') {
        const existing = grouped.get(assignment.employeeId) || []
        existing.push(shift)
        grouped.set(assignment.employeeId, existing)
      }
    }
  }
  return grouped
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate shift times
 */
export function validateShiftTimes(startTime: string, endTime: string): string | null {
  const start = parseTime(startTime)
  const end = parseTime(endTime)

  if (start === end) {
    return 'Start and end time cannot be the same'
  }

  // Allow overnight shifts, but warn if very long
  let duration = end - start
  if (duration < 0) duration += 24 * 60 // overnight

  if (duration < 60) {
    return 'Shift must be at least 1 hour'
  }

  if (duration > 16 * 60) {
    return 'Shift cannot exceed 16 hours'
  }

  return null
}

/**
 * Validate break duration
 */
export function validateBreakDuration(shiftHours: number, breakMinutes: number): string | null {
  if (breakMinutes < 0) {
    return 'Break duration cannot be negative'
  }

  const maxBreak = Math.floor(shiftHours * 60 * 0.5) // Max 50% of shift
  if (breakMinutes > maxBreak) {
    return `Break cannot exceed ${formatDuration(maxBreak / 60)} for this shift`
  }

  // Legal requirements (simplified)
  if (shiftHours > 6 && breakMinutes < 30) {
    return 'Shifts over 6 hours require at least 30 minutes break'
  }

  return null
}
