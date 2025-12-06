// Schedule Utility Functions
// Provides validation, conflict detection, and business logic for scheduling

import { prisma } from './prisma'
import type {
  ScheduleEntry,
  ScheduleConflict,
  ScheduleGap,
  ScheduleFilters,
  DaySchedule,
  CalendarMonth,
  CalendarWeek,
  CalendarDay
} from '@/types/schedule'

// ==================== TIME UTILITIES ====================

/**
 * Validates time format (HH:MM in 24-hour format)
 */
export function isValidTimeFormat(time: string): boolean {
  const regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(time)
}

/**
 * Converts time string to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Converts minutes since midnight to time string
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Calculates duration between two times in hours
 */
export function calculateDuration(startTime: string, endTime: string): number {
  const startMinutes = timeToMinutes(startTime)
  let endMinutes = timeToMinutes(endTime)

  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60
  }

  return (endMinutes - startMinutes) / 60
}

/**
 * Checks if two time ranges overlap
 */
export function doTimesOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  const s1 = timeToMinutes(start1)
  let e1 = timeToMinutes(end1)
  const s2 = timeToMinutes(start2)
  let e2 = timeToMinutes(end2)

  // Handle overnight shifts
  if (e1 < s1) e1 += 24 * 60
  if (e2 < s2) e2 += 24 * 60

  return s1 < e2 && e1 > s2
}

/**
 * Validates that start time is before end time
 */
export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false
  }
  // For overnight shifts, end can be less than start
  return true
}

// ==================== DATE UTILITIES ====================

/**
 * Formats date to YYYY-MM-DD string
 */
export function formatDateToISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Parses YYYY-MM-DD string to Date
 */
export function parseISODate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00')
}

/**
 * Gets the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  return d
}

/**
 * Gets the end of the week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (6 - day))
  return d
}

/**
 * Checks if a date is in the past
 */
export function isDateInPast(dateStr: string): boolean {
  const date = parseISODate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

/**
 * Checks if a date is today
 */
export function isToday(dateStr: string): boolean {
  const date = parseISODate(dateStr)
  const today = new Date()
  return formatDateToISO(date) === formatDateToISO(today)
}

// ==================== VALIDATION ====================

/**
 * Validates a schedule entry for common issues
 */
export function validateScheduleEntry(entry: {
  date: string
  startTime: string
  endTime: string
  userId?: string | null
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    errors.push('Invalid date format. Use YYYY-MM-DD')
  }

  // Validate time formats
  if (!isValidTimeFormat(entry.startTime)) {
    errors.push('Invalid start time format. Use HH:MM (24-hour)')
  }

  if (!isValidTimeFormat(entry.endTime)) {
    errors.push('Invalid end time format. Use HH:MM (24-hour)')
  }

  // Check duration (minimum 30 minutes)
  if (isValidTimeFormat(entry.startTime) && isValidTimeFormat(entry.endTime)) {
    const duration = calculateDuration(entry.startTime, entry.endTime)
    if (duration < 0.5) {
      errors.push('Shift duration must be at least 30 minutes')
    }
    if (duration > 16) {
      errors.push('Shift duration cannot exceed 16 hours')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validates a shift definition
 */
export function validateShiftDefinition(shift: {
  name: string
  startTime: string
  endTime: string
  minStaffRequired?: number
  maxStaffAllowed?: number
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!shift.name || shift.name.trim().length === 0) {
    errors.push('Shift name is required')
  }

  if (!isValidTimeFormat(shift.startTime)) {
    errors.push('Invalid start time format')
  }

  if (!isValidTimeFormat(shift.endTime)) {
    errors.push('Invalid end time format')
  }

  if (shift.minStaffRequired !== undefined && shift.minStaffRequired < 0) {
    errors.push('Minimum staff required cannot be negative')
  }

  if (shift.maxStaffAllowed !== undefined && shift.maxStaffAllowed < 1) {
    errors.push('Maximum staff allowed must be at least 1')
  }

  if (
    shift.minStaffRequired !== undefined &&
    shift.maxStaffAllowed !== undefined &&
    shift.minStaffRequired > shift.maxStaffAllowed
  ) {
    errors.push('Minimum staff cannot exceed maximum staff')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// ==================== CONFLICT DETECTION ====================

/**
 * Checks for scheduling conflicts for an employee on a specific date
 */
export async function detectConflicts(
  facilityId: string,
  userId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeEntryId?: string
): Promise<ScheduleConflict[]> {
  const conflicts: ScheduleConflict[] = []

  // Get existing entries for this user on this date
  const existingEntries = await prisma.scheduleEntry.findMany({
    where: {
      facilityId,
      userId,
      date: new Date(date),
      status: { not: 'CANCELLED' },
      id: excludeEntryId ? { not: excludeEntryId } : undefined
    }
  })

  // Check for overlapping shifts
  for (const entry of existingEntries) {
    if (doTimesOverlap(startTime, endTime, entry.startTime, entry.endTime)) {
      conflicts.push({
        type: 'overlap',
        entryId: excludeEntryId || 'new',
        conflictingEntryId: entry.id,
        userId,
        date,
        message: `Overlaps with existing shift from ${entry.startTime} to ${entry.endTime}`
      })
    }
  }

  // Check for approved time-off
  const timeOff = await prisma.timeOffRequest.findFirst({
    where: {
      userId,
      status: 'APPROVED',
      startDate: { lte: new Date(date) },
      endDate: { gte: new Date(date) }
    }
  })

  if (timeOff) {
    conflicts.push({
      type: 'time_off',
      entryId: excludeEntryId || 'new',
      userId,
      date,
      message: `Employee has approved time off on this date`
    })
  }

  // Check availability
  const dayOfWeek = new Date(date).getDay()
  const availability = await prisma.employeeAvailability.findUnique({
    where: {
      userId_dayOfWeek: {
        userId,
        dayOfWeek
      }
    }
  })

  if (availability && !availability.isAvailable) {
    conflicts.push({
      type: 'unavailable',
      entryId: excludeEntryId || 'new',
      userId,
      date,
      message: `Employee is marked as unavailable on ${getDayName(dayOfWeek)}`
    })
  } else if (availability && availability.isAvailable && availability.startTime && availability.endTime) {
    // Check if shift fits within availability window
    if (!doTimesOverlap(startTime, endTime, availability.startTime, availability.endTime)) {
      conflicts.push({
        type: 'unavailable',
        entryId: excludeEntryId || 'new',
        userId,
        date,
        message: `Shift is outside employee's available hours (${availability.startTime}-${availability.endTime})`
      })
    }
  }

  return conflicts
}

/**
 * Checks if an employee can work the proposed hours without exceeding limits
 */
export async function checkWeeklyHoursLimit(
  facilityId: string,
  userId: string,
  weekStartDate: string,
  additionalHours: number,
  maxHoursPerWeek: number = 40
): Promise<{ allowed: boolean; currentHours: number; message?: string }> {
  const weekStart = new Date(weekStartDate)
  const weekEnd = new Date(weekStartDate)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const entries = await prisma.scheduleEntry.findMany({
    where: {
      facilityId,
      userId,
      date: {
        gte: weekStart,
        lte: weekEnd
      },
      status: { not: 'CANCELLED' }
    }
  })

  const currentHours = entries.reduce((total: number, entry: typeof entries[number]) => {
    return total + calculateDuration(entry.startTime, entry.endTime)
  }, 0)

  const totalHours = currentHours + additionalHours

  if (totalHours > maxHoursPerWeek) {
    return {
      allowed: false,
      currentHours,
      message: `Adding ${additionalHours} hours would exceed weekly limit of ${maxHoursPerWeek} hours (current: ${currentHours})`
    }
  }

  return {
    allowed: true,
    currentHours
  }
}

// ==================== SCHEDULE QUERIES ====================

/**
 * Gets schedule entries for a date range with optional filters
 */
export async function getScheduleEntries(filters: ScheduleFilters) {
  const where: any = {}

  if (filters.facilityId) {
    where.facilityId = filters.facilityId
  }

  if (filters.userId) {
    where.userId = filters.userId
  }

  if (filters.rinkId) {
    where.rinkId = filters.rinkId
  }

  if (filters.shiftId) {
    where.shiftId = filters.shiftId
  }

  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) {
      where.date.gte = new Date(filters.startDate)
    }
    if (filters.endDate) {
      where.date.lte = new Date(filters.endDate)
    }
  }

  if (filters.status) {
    where.status = Array.isArray(filters.status)
      ? { in: filters.status }
      : filters.status
  }

  if (filters.isOpenShift !== undefined) {
    where.isOpenShift = filters.isOpenShift
  }

  if (filters.isEmergency !== undefined) {
    where.isEmergency = filters.isEmergency
  }

  return prisma.scheduleEntry.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      shift: true,
      rink: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: [
      { date: 'asc' },
      { startTime: 'asc' }
    ]
  })
}

/**
 * Gets schedule summary/stats for a facility
 */
export async function getScheduleStats(
  facilityId: string,
  startDate: string,
  endDate: string
) {
  const entries = await prisma.scheduleEntry.findMany({
    where: {
      facilityId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    select: {
      id: true,
      status: true,
      isOpenShift: true,
      isEmergency: true,
      userId: true
    }
  })

  const uniqueEmployees = new Set(entries.filter((e: typeof entries[number]) => e.userId).map((e: typeof entries[number]) => e.userId))

  type Entry = typeof entries[number]
  return {
    totalEntries: entries.length,
    publishedEntries: entries.filter((e: Entry) => e.status === 'PUBLISHED').length,
    draftEntries: entries.filter((e: Entry) => e.status === 'DRAFT').length,
    openShifts: entries.filter((e: Entry) => e.isOpenShift && e.status !== 'FILLED').length,
    emergencyShifts: entries.filter((e: Entry) => e.isEmergency).length,
    filledShifts: entries.filter((e: Entry) => e.status === 'FILLED').length,
    cancelledShifts: entries.filter((e: Entry) => e.status === 'CANCELLED').length,
    uniqueEmployees: uniqueEmployees.size
  }
}

/**
 * Finds scheduling gaps (times without adequate coverage)
 */
export async function findScheduleGaps(
  facilityId: string,
  date: string,
  rinkId?: string
): Promise<ScheduleGap[]> {
  const gaps: ScheduleGap[] = []

  // Get shift definitions for the facility
  const shifts = await prisma.shiftDefinition.findMany({
    where: {
      facilityId,
      isActive: true,
      rinkId: rinkId || null
    }
  })

  // Get schedule entries for this date
  const entries = await prisma.scheduleEntry.findMany({
    where: {
      facilityId,
      date: new Date(date),
      status: { in: ['PUBLISHED', 'FILLED'] },
      rinkId: rinkId || null
    }
  })

  // Check each shift for adequate coverage
  for (const shift of shifts) {
    const shiftEntries = entries.filter((e: typeof entries[number]) => e.shiftId === shift.id)
    const staffCount = shiftEntries.length

    if (staffCount < shift.minStaffRequired) {
      gaps.push({
        date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        shiftId: shift.id,
        rinkId: rinkId || undefined,
        requiredStaff: shift.minStaffRequired,
        currentStaff: staffCount
      })
    }
  }

  return gaps
}

// ==================== CALENDAR HELPERS ====================

/**
 * Generates calendar month data with schedule entries
 */
export async function generateCalendarMonth(
  facilityId: string,
  year: number,
  month: number, // 0-11
  userId?: string
): Promise<CalendarMonth> {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Get entries for the month
  const entries = await getScheduleEntries({
    facilityId,
    userId,
    startDate: formatDateToISO(firstDay),
    endDate: formatDateToISO(lastDay)
  })

  // Group entries by date
  const entriesByDate: Record<string, any[]> = {}
  for (const entry of entries) {
    const dateStr = formatDateToISO(new Date(entry.date))
    if (!entriesByDate[dateStr]) {
      entriesByDate[dateStr] = []
    }
    entriesByDate[dateStr].push(entry)
  }

  // Generate weeks
  const weeks: CalendarWeek[] = []
  let currentDate = new Date(firstDay)
  currentDate.setDate(currentDate.getDate() - currentDate.getDay()) // Start from Sunday

  const today = formatDateToISO(new Date())
  let weekNumber = 1

  while (currentDate <= lastDay || currentDate.getDay() !== 0) {
    const week: CalendarWeek = {
      weekNumber,
      days: []
    }

    for (let i = 0; i < 7; i++) {
      const dateStr = formatDateToISO(currentDate)
      const dayEntries = entriesByDate[dateStr] || []

      week.days.push({
        date: dateStr,
        dayOfWeek: i,
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: dateStr === today,
        entries: dayEntries,
        hasOpenShifts: dayEntries.some((e: any) => e.isOpenShift && e.status !== 'FILLED'),
        hasEmergencyShifts: dayEntries.some((e: any) => e.isEmergency),
        totalStaff: dayEntries.filter((e: any) => e.userId && e.status !== 'CANCELLED').length
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    weeks.push(week)
    weekNumber++

    // Stop if we've gone past the month
    if (currentDate.getMonth() !== month && currentDate.getDay() === 0) {
      break
    }
  }

  return {
    year,
    month,
    weeks
  }
}

// ==================== HELPERS ====================

function getDayName(dayOfWeek: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek]
}

/**
 * Publishes all draft schedule entries for a date range
 */
export async function publishSchedule(
  facilityId: string,
  startDate: string,
  endDate: string,
  publishedById: string
) {
  const result = await prisma.scheduleEntry.updateMany({
    where: {
      facilityId,
      status: 'DRAFT',
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    data: {
      status: 'PUBLISHED',
      publishedAt: new Date(),
      publishedById
    }
  })

  return result.count
}

/**
 * Claims an open shift for an employee
 */
export async function claimOpenShift(
  entryId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const entry = await prisma.scheduleEntry.findUnique({
    where: { id: entryId }
  })

  if (!entry) {
    return { success: false, message: 'Schedule entry not found' }
  }

  if (!entry.isOpenShift) {
    return { success: false, message: 'This is not an open shift' }
  }

  if (entry.status === 'FILLED') {
    return { success: false, message: 'This shift has already been filled' }
  }

  if (entry.status === 'CANCELLED') {
    return { success: false, message: 'This shift has been cancelled' }
  }

  // Check for conflicts
  const conflicts = await detectConflicts(
    entry.facilityId,
    userId,
    formatDateToISO(entry.date),
    entry.startTime,
    entry.endTime
  )

  if (conflicts.length > 0) {
    return {
      success: false,
      message: conflicts.map(c => c.message).join('; ')
    }
  }

  // Claim the shift
  await prisma.scheduleEntry.update({
    where: { id: entryId },
    data: {
      userId,
      status: 'FILLED',
      isOpenShift: false,
      claimedAt: new Date(),
      claimedById: userId
    }
  })

  return { success: true, message: 'Shift claimed successfully' }
}

/**
 * Joins the waitlist for an open shift
 */
export async function joinShiftWaitlist(
  entryId: string,
  userId: string
): Promise<{ success: boolean; position: number; message: string }> {
  const entry = await prisma.scheduleEntry.findUnique({
    where: { id: entryId }
  })

  if (!entry) {
    return { success: false, position: 0, message: 'Schedule entry not found' }
  }

  if (!entry.isOpenShift) {
    return { success: false, position: 0, message: 'This is not an open shift' }
  }

  const currentWaitlist = (entry.waitlistUsers as string[]) || []

  if (currentWaitlist.includes(userId)) {
    const position = currentWaitlist.indexOf(userId) + 1
    return { success: false, position, message: 'Already on the waitlist' }
  }

  const newWaitlist = [...currentWaitlist, userId]

  await prisma.scheduleEntry.update({
    where: { id: entryId },
    data: {
      waitlistUsers: newWaitlist
    }
  })

  return {
    success: true,
    position: newWaitlist.length,
    message: `Added to waitlist at position ${newWaitlist.length}`
  }
}

/**
 * Leaves the waitlist for an open shift
 */
export async function leaveShiftWaitlist(
  entryId: string,
  userId: string
): Promise<{ success: boolean; message: string }> {
  const entry = await prisma.scheduleEntry.findUnique({
    where: { id: entryId }
  })

  if (!entry) {
    return { success: false, message: 'Schedule entry not found' }
  }

  const currentWaitlist = (entry.waitlistUsers as string[]) || []

  if (!currentWaitlist.includes(userId)) {
    return { success: false, message: 'Not on the waitlist' }
  }

  const newWaitlist = currentWaitlist.filter(id => id !== userId)

  await prisma.scheduleEntry.update({
    where: { id: entryId },
    data: {
      waitlistUsers: newWaitlist.length > 0 ? newWaitlist : null
    }
  })

  return { success: true, message: 'Removed from waitlist' }
}
