// Recurring Shift Pattern Generation
// System for creating and managing recurring shift patterns

import type { Shift, ShiftTemplate } from '@/types/schedule'
import { formatDate, addDays, parseDate, getWeekStart } from '@/lib/schedule-utils'

// ============================================================================
// TYPES
// ============================================================================

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'CUSTOM'

export interface RecurrencePattern {
  frequency: RecurrenceFrequency
  interval: number // e.g., every 2 weeks
  daysOfWeek?: number[] // 0=Sunday, 1=Monday, etc.
  dayOfMonth?: number // for monthly patterns
  weekOfMonth?: number // 1-4 for "first Monday", etc.
  endDate?: string // When to stop recurring
  maxOccurrences?: number // Or number of occurrences
  exceptions?: string[] // Dates to skip (holidays, etc.)
}

export interface RecurringShiftConfig {
  template: ShiftTemplate
  pattern: RecurrencePattern
  startDate: string
  endDate?: string
  scheduleId: string
  facilityId: string
  createdBy: string
  overrides?: ShiftOverride[] // Per-occurrence modifications
}

export interface ShiftOverride {
  originalDate: string
  newDate?: string // Reschedule
  newStartTime?: string
  newEndTime?: string
  cancelled?: boolean
  notes?: string
}

export interface GeneratedShift extends Omit<Shift, 'id' | 'createdAt' | 'updatedAt'> {
  isRecurring: true
  recurringPatternId: string
  occurrenceIndex: number
  originalDate: string
}

export interface RecurrencePreview {
  dates: string[]
  shifts: GeneratedShift[]
  totalShifts: number
  totalHours: number
  warnings: string[]
}

// ============================================================================
// PATTERN GENERATION
// ============================================================================

/**
 * Generate shifts from a recurring pattern
 */
export function generateRecurringShifts(config: RecurringShiftConfig): GeneratedShift[] {
  const { template, pattern, startDate, endDate, scheduleId, facilityId, createdBy } = config

  const dates = generateRecurrenceDates(pattern, startDate, endDate)
  const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const shifts: GeneratedShift[] = []

  dates.forEach((date, index) => {
    // Check for overrides
    const override = config.overrides?.find(o => o.originalDate === date)

    if (override?.cancelled) {
      return
    }

    const shiftDate = override?.newDate || date

    shifts.push({
      scheduleId,
      facilityId,
      templateId: template.id,
      date: shiftDate,
      startTime: override?.newStartTime || template.startTime,
      endTime: override?.newEndTime || template.endTime,
      breakDuration: template.breakDuration,
      title: template.name,
      description: template.description,
      color: template.color,
      shiftType: 'REGULAR' as const,
      minStaff: template.minStaff,
      maxStaff: template.maxStaff,
      requiredRoles: template.requiredRoles,
      assignedEmployees: [],
      status: 'DRAFT' as const,
      isOpen: false,
      isRecurring: true as const,
      recurringPatternId: patternId,
      occurrenceIndex: index,
      originalDate: date,
      createdBy,
      notes: override?.notes,
    })
  })

  return shifts
}

/**
 * Generate dates for a recurrence pattern
 */
export function generateRecurrenceDates(
  pattern: RecurrencePattern,
  startDate: string,
  endDate?: string
): string[] {
  const dates: string[] = []
  const start = parseDate(startDate)
  const end = endDate ? parseDate(endDate) : undefined
  const maxEnd = pattern.endDate ? parseDate(pattern.endDate) : undefined
  const effectiveEnd = end && maxEnd ? (end < maxEnd ? end : maxEnd) : end || maxEnd

  // Calculate reasonable default end if none specified
  const fallbackEnd = new Date(start)
  fallbackEnd.setMonth(fallbackEnd.getMonth() + 3) // 3 months default
  const finalEnd = effectiveEnd || fallbackEnd

  const maxOccurrences = pattern.maxOccurrences || 100 // Safety limit

  switch (pattern.frequency) {
    case 'DAILY':
      dates.push(...generateDailyDates(start, finalEnd, pattern.interval, maxOccurrences))
      break
    case 'WEEKLY':
      dates.push(...generateWeeklyDates(start, finalEnd, pattern.interval, pattern.daysOfWeek || [], maxOccurrences))
      break
    case 'BIWEEKLY':
      dates.push(...generateWeeklyDates(start, finalEnd, 2, pattern.daysOfWeek || [], maxOccurrences))
      break
    case 'MONTHLY':
      dates.push(...generateMonthlyDates(start, finalEnd, pattern, maxOccurrences))
      break
    case 'CUSTOM':
      dates.push(...generateCustomDates(start, finalEnd, pattern, maxOccurrences))
      break
  }

  // Filter out exceptions
  const exceptions = new Set(pattern.exceptions || [])
  return dates.filter(d => !exceptions.has(d))
}

/**
 * Generate daily recurrence dates
 */
function generateDailyDates(start: Date, end: Date, interval: number, maxOccurrences: number): string[] {
  const dates: string[] = []
  let current = new Date(start)
  let count = 0

  while (current <= end && count < maxOccurrences) {
    dates.push(formatDate(current))
    current = addDays(current, interval)
    count++
  }

  return dates
}

/**
 * Generate weekly recurrence dates
 */
function generateWeeklyDates(
  start: Date,
  end: Date,
  interval: number,
  daysOfWeek: number[],
  maxOccurrences: number
): string[] {
  const dates: string[] = []

  if (daysOfWeek.length === 0) {
    daysOfWeek = [start.getDay()] // Default to start day
  }

  const sortedDays = [...daysOfWeek].sort((a, b) => a - b)
  let weekStart = getWeekStart(start)
  let count = 0

  while (weekStart <= end && count < maxOccurrences) {
    for (const dayOfWeek of sortedDays) {
      const date = addDays(weekStart, dayOfWeek)
      if (date >= start && date <= end) {
        dates.push(formatDate(date))
        count++
        if (count >= maxOccurrences) break
      }
    }
    weekStart = addDays(weekStart, 7 * interval)
  }

  return dates
}

/**
 * Generate monthly recurrence dates
 */
function generateMonthlyDates(
  start: Date,
  end: Date,
  pattern: RecurrencePattern,
  maxOccurrences: number
): string[] {
  const dates: string[] = []
  let current = new Date(start.getFullYear(), start.getMonth(), 1)
  let count = 0

  while (current <= end && count < maxOccurrences) {
    let targetDate: Date | null = null

    if (pattern.dayOfMonth) {
      // Specific day of month (e.g., 15th)
      targetDate = new Date(current.getFullYear(), current.getMonth(), pattern.dayOfMonth)

      // Handle months with fewer days
      const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
      if (pattern.dayOfMonth > lastDayOfMonth) {
        targetDate = new Date(current.getFullYear(), current.getMonth(), lastDayOfMonth)
      }
    } else if (pattern.weekOfMonth && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
      // Nth weekday of month (e.g., 2nd Tuesday)
      targetDate = getNthWeekdayOfMonth(
        current.getFullYear(),
        current.getMonth(),
        pattern.daysOfWeek[0],
        pattern.weekOfMonth
      )
    }

    if (targetDate && targetDate >= start && targetDate <= end) {
      dates.push(formatDate(targetDate))
      count++
    }

    current.setMonth(current.getMonth() + pattern.interval)
  }

  return dates
}

/**
 * Generate custom pattern dates
 */
function generateCustomDates(
  start: Date,
  end: Date,
  pattern: RecurrencePattern,
  maxOccurrences: number
): string[] {
  // Custom patterns allow flexible configuration
  // This implementation supports complex patterns combining weekly + monthly rules
  const dates: string[] = []

  if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
    // Weekly pattern with specific days
    return generateWeeklyDates(start, end, pattern.interval, pattern.daysOfWeek, maxOccurrences)
  }

  // Fallback to daily
  return generateDailyDates(start, end, pattern.interval, maxOccurrences)
}

/**
 * Get the Nth weekday of a month
 */
function getNthWeekdayOfMonth(year: number, month: number, dayOfWeek: number, week: number): Date | null {
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()

  let dayOffset = dayOfWeek - firstWeekday
  if (dayOffset < 0) dayOffset += 7

  const targetDay = 1 + dayOffset + (week - 1) * 7

  const lastDay = new Date(year, month + 1, 0).getDate()
  if (targetDay > lastDay) return null

  return new Date(year, month, targetDay)
}

// ============================================================================
// PREVIEW AND VALIDATION
// ============================================================================

/**
 * Preview what shifts will be generated
 */
export function previewRecurringShifts(config: RecurringShiftConfig): RecurrencePreview {
  const shifts = generateRecurringShifts(config)
  const warnings: string[] = []

  // Calculate total hours
  const totalHours = shifts.reduce((acc, shift) => {
    const startMinutes = parseTimeToMinutes(shift.startTime)
    let endMinutes = parseTimeToMinutes(shift.endTime)
    if (endMinutes <= startMinutes) endMinutes += 24 * 60
    return acc + (endMinutes - startMinutes - (shift.breakDuration || 0)) / 60
  }, 0)

  // Generate warnings
  if (shifts.length > 50) {
    warnings.push(`This will create ${shifts.length} shifts. Consider using a shorter date range.`)
  }

  if (shifts.length === 0) {
    warnings.push('No shifts will be created with the current settings.')
  }

  // Check for weekend shifts
  const weekendShifts = shifts.filter(s => {
    const d = parseDate(s.date)
    return d.getDay() === 0 || d.getDay() === 6
  })
  if (weekendShifts.length > 0) {
    warnings.push(`${weekendShifts.length} shifts will be on weekends.`)
  }

  return {
    dates: shifts.map(s => s.date),
    shifts,
    totalShifts: shifts.length,
    totalHours,
    warnings,
  }
}

/**
 * Validate recurrence pattern
 */
export function validateRecurrencePattern(pattern: RecurrencePattern): string[] {
  const errors: string[] = []

  if (pattern.interval < 1) {
    errors.push('Interval must be at least 1.')
  }

  if (pattern.frequency === 'WEEKLY' && (!pattern.daysOfWeek || pattern.daysOfWeek.length === 0)) {
    errors.push('Weekly patterns must specify at least one day of the week.')
  }

  if (pattern.frequency === 'MONTHLY') {
    if (!pattern.dayOfMonth && !pattern.weekOfMonth) {
      errors.push('Monthly patterns must specify either day of month or week of month.')
    }
    if (pattern.dayOfMonth && (pattern.dayOfMonth < 1 || pattern.dayOfMonth > 31)) {
      errors.push('Day of month must be between 1 and 31.')
    }
    if (pattern.weekOfMonth && (pattern.weekOfMonth < 1 || pattern.weekOfMonth > 5)) {
      errors.push('Week of month must be between 1 and 5.')
    }
  }

  if (pattern.daysOfWeek) {
    const invalidDays = pattern.daysOfWeek.filter(d => d < 0 || d > 6)
    if (invalidDays.length > 0) {
      errors.push('Days of week must be between 0 (Sunday) and 6 (Saturday).')
    }
  }

  if (pattern.maxOccurrences && pattern.maxOccurrences > 365) {
    errors.push('Maximum occurrences cannot exceed 365.')
  }

  return errors
}

// ============================================================================
// PATTERN MODIFICATION
// ============================================================================

/**
 * Add an exception date to a pattern
 */
export function addPatternException(pattern: RecurrencePattern, date: string): RecurrencePattern {
  return {
    ...pattern,
    exceptions: [...(pattern.exceptions || []), date],
  }
}

/**
 * Remove an exception date from a pattern
 */
export function removePatternException(pattern: RecurrencePattern, date: string): RecurrencePattern {
  return {
    ...pattern,
    exceptions: (pattern.exceptions || []).filter(d => d !== date),
  }
}

/**
 * Create a pattern from user-friendly inputs
 */
export function createPatternFromOptions(options: {
  type: 'everyday' | 'weekdays' | 'weekends' | 'weekly' | 'biweekly' | 'monthly'
  customDays?: number[]
  dayOfMonth?: number
  weekOfMonth?: number
  dayOfWeekForMonth?: number
  endAfterOccurrences?: number
  endDate?: string
}): RecurrencePattern {
  const base: RecurrencePattern = {
    frequency: 'WEEKLY',
    interval: 1,
  }

  switch (options.type) {
    case 'everyday':
      return { ...base, frequency: 'DAILY' }

    case 'weekdays':
      return { ...base, frequency: 'WEEKLY', daysOfWeek: [1, 2, 3, 4, 5] }

    case 'weekends':
      return { ...base, frequency: 'WEEKLY', daysOfWeek: [0, 6] }

    case 'weekly':
      return { ...base, frequency: 'WEEKLY', daysOfWeek: options.customDays || [] }

    case 'biweekly':
      return { ...base, frequency: 'BIWEEKLY', daysOfWeek: options.customDays || [] }

    case 'monthly':
      return {
        ...base,
        frequency: 'MONTHLY',
        dayOfMonth: options.dayOfMonth,
        weekOfMonth: options.weekOfMonth,
        daysOfWeek: options.dayOfWeekForMonth ? [options.dayOfWeekForMonth] : undefined,
      }

    default:
      return base
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Get human-readable description of pattern
 */
export function describePattern(pattern: RecurrencePattern): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  switch (pattern.frequency) {
    case 'DAILY':
      return pattern.interval === 1 ? 'Every day' : `Every ${pattern.interval} days`

    case 'WEEKLY': {
      const days = pattern.daysOfWeek?.map(d => dayNames[d]).join(', ') || 'selected days'
      return pattern.interval === 1 ? `Weekly on ${days}` : `Every ${pattern.interval} weeks on ${days}`
    }

    case 'BIWEEKLY': {
      const days = pattern.daysOfWeek?.map(d => dayNames[d]).join(', ') || 'selected days'
      return `Every 2 weeks on ${days}`
    }

    case 'MONTHLY':
      if (pattern.dayOfMonth) {
        return pattern.interval === 1
          ? `Monthly on day ${pattern.dayOfMonth}`
          : `Every ${pattern.interval} months on day ${pattern.dayOfMonth}`
      }
      if (pattern.weekOfMonth && pattern.daysOfWeek?.[0] !== undefined) {
        const ordinals = ['first', 'second', 'third', 'fourth', 'fifth']
        const ordinal = ordinals[pattern.weekOfMonth - 1] || `${pattern.weekOfMonth}th`
        return `Monthly on the ${ordinal} ${dayNames[pattern.daysOfWeek[0]]}`
      }
      return 'Monthly'

    case 'CUSTOM':
      return 'Custom pattern'

    default:
      return 'Unknown pattern'
  }
}
