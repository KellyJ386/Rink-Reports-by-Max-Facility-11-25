import {
  ScheduleEntry,
  TimeOffRequest,
  EmployeeAvailability,
  ShiftDefinition,
  TimeOffStatus,
  AvailabilityPreference
} from '@prisma/client'
import {
  ScheduleConflict,
  ConflictType,
  ConflictSettings,
  ScheduleEntryWithUser
} from '@/types/schedule'
import {
  parseISO,
  isWithinInterval,
  differenceInHours,
  differenceInMinutes,
  addDays,
  startOfDay,
  endOfDay,
  format,
  isSameDay,
  getDay
} from 'date-fns'

const DEFAULT_CONFLICT_SETTINGS: ConflictSettings = {
  minRestHours: 8,
  maxHoursPerDay: 12,
  maxHoursPerWeek: 40,
  enableAvailabilityCheck: true,
  enableTimeOffCheck: true,
  enableOvertimeWarnings: true,
}

interface TimeRange {
  start: Date
  end: Date
}

function parseTimeToDate(dateStr: string, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const date = parseISO(dateStr)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function getShiftDuration(entry: { startTime: string; endTime: string; breakMinutes?: number }): number {
  const [startHour, startMin] = entry.startTime.split(':').map(Number)
  const [endHour, endMin] = entry.endTime.split(':').map(Number)

  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)

  // Handle overnight shifts
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60
  }

  // Subtract break time
  totalMinutes -= entry.breakMinutes || 0

  return totalMinutes / 60 // Return hours
}

function doTimeRangesOverlap(range1: TimeRange, range2: TimeRange): boolean {
  return range1.start < range2.end && range2.start < range1.end
}

function getEntryTimeRange(entry: ScheduleEntry): TimeRange {
  const dateStr = typeof entry.date === 'string'
    ? entry.date.split('T')[0]
    : format(entry.date, 'yyyy-MM-dd')

  return {
    start: parseTimeToDate(dateStr, entry.startTime),
    end: parseTimeToDate(dateStr, entry.endTime),
  }
}

/**
 * Detect all scheduling conflicts for a given set of schedule entries
 */
export function detectConflicts(
  entries: ScheduleEntry[],
  timeOffRequests: TimeOffRequest[],
  availability: EmployeeAvailability[],
  shifts: ShiftDefinition[],
  settings: Partial<ConflictSettings> = {}
): ScheduleConflict[] {
  const config = { ...DEFAULT_CONFLICT_SETTINGS, ...settings }
  const conflicts: ScheduleConflict[] = []

  // Group entries by user for employee-specific checks
  const entriesByUser = new Map<string, ScheduleEntry[]>()
  for (const entry of entries) {
    if (entry.userId) {
      const userEntries = entriesByUser.get(entry.userId) || []
      userEntries.push(entry)
      entriesByUser.set(entry.userId, userEntries)
    }
  }

  // Group entries by date for staffing checks
  const entriesByDateAndShift = new Map<string, ScheduleEntry[]>()
  for (const entry of entries) {
    if (entry.shiftId) {
      const dateStr = typeof entry.date === 'string'
        ? entry.date.split('T')[0]
        : format(entry.date, 'yyyy-MM-dd')
      const key = `${dateStr}-${entry.shiftId}`
      const shiftEntries = entriesByDateAndShift.get(key) || []
      shiftEntries.push(entry)
      entriesByDateAndShift.set(key, shiftEntries)
    }
  }

  // Check each user's entries for conflicts
  for (const [userId, userEntries] of entriesByUser) {
    // Sort by date and time
    const sortedEntries = [...userEntries].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      if (dateA !== dateB) return dateA - dateB
      return a.startTime.localeCompare(b.startTime)
    })

    // Check for double booking
    conflicts.push(...detectDoubleBooking(sortedEntries))

    // Check for insufficient rest between shifts
    if (config.minRestHours > 0) {
      conflicts.push(...detectInsufficientRest(sortedEntries, config.minRestHours))
    }

    // Check overtime
    if (config.enableOvertimeWarnings) {
      conflicts.push(...detectOvertime(sortedEntries, config.maxHoursPerDay, config.maxHoursPerWeek))
    }

    // Check availability conflicts
    if (config.enableAvailabilityCheck) {
      const userAvailability = availability.filter(a => a.userId === userId)
      conflicts.push(...detectAvailabilityConflicts(sortedEntries, userAvailability))
    }

    // Check time-off conflicts
    if (config.enableTimeOffCheck) {
      const userTimeOff = timeOffRequests.filter(
        t => t.userId === userId && t.status === TimeOffStatus.APPROVED
      )
      conflicts.push(...detectTimeOffConflicts(sortedEntries, userTimeOff))
    }
  }

  // Check staffing levels
  const shiftsMap = new Map(shifts.map(s => [s.id, s]))
  for (const [key, shiftEntries] of entriesByDateAndShift) {
    const shiftId = key.split('-').pop()!
    const shift = shiftsMap.get(shiftId)
    if (shift) {
      conflicts.push(...detectStaffingConflicts(shiftEntries, shift, key.split('-')[0]))
    }
  }

  return conflicts
}

/**
 * Detect double booking - employee scheduled for overlapping shifts
 */
function detectDoubleBooking(sortedEntries: ScheduleEntry[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const current = sortedEntries[i]
    const next = sortedEntries[i + 1]

    const currentRange = getEntryTimeRange(current)
    const nextRange = getEntryTimeRange(next)

    if (doTimeRangesOverlap(currentRange, nextRange)) {
      conflicts.push({
        type: 'DOUBLE_BOOKED',
        severity: 'error',
        message: `Employee is double-booked: shifts overlap on ${format(currentRange.start, 'MMM d')}`,
        affectedEntryIds: [current.id, next.id],
        affectedUserIds: current.userId ? [current.userId] : undefined,
      })
    }
  }

  return conflicts
}

/**
 * Detect insufficient rest between consecutive shifts
 */
function detectInsufficientRest(
  sortedEntries: ScheduleEntry[],
  minRestHours: number
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  for (let i = 0; i < sortedEntries.length - 1; i++) {
    const current = sortedEntries[i]
    const next = sortedEntries[i + 1]

    const currentRange = getEntryTimeRange(current)
    const nextRange = getEntryTimeRange(next)

    const restHours = differenceInHours(nextRange.start, currentRange.end)

    if (restHours > 0 && restHours < minRestHours) {
      conflicts.push({
        type: 'INSUFFICIENT_REST',
        severity: 'warning',
        message: `Only ${restHours} hours rest between shifts (minimum: ${minRestHours} hours)`,
        affectedEntryIds: [current.id, next.id],
        affectedUserIds: current.userId ? [current.userId] : undefined,
      })
    }
  }

  return conflicts
}

/**
 * Detect overtime - exceeding max hours per day or week
 */
function detectOvertime(
  entries: ScheduleEntry[],
  maxHoursPerDay: number,
  maxHoursPerWeek: number
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  // Group by date for daily check
  const hoursByDate = new Map<string, { hours: number; entryIds: string[] }>()

  for (const entry of entries) {
    const dateStr = typeof entry.date === 'string'
      ? entry.date.split('T')[0]
      : format(entry.date, 'yyyy-MM-dd')

    const hours = getShiftDuration(entry)
    const existing = hoursByDate.get(dateStr) || { hours: 0, entryIds: [] }
    existing.hours += hours
    existing.entryIds.push(entry.id)
    hoursByDate.set(dateStr, existing)
  }

  // Check daily overtime
  for (const [dateStr, data] of hoursByDate) {
    if (data.hours > maxHoursPerDay) {
      conflicts.push({
        type: 'OVERTIME',
        severity: 'warning',
        message: `${data.hours.toFixed(1)} hours scheduled on ${dateStr} (max: ${maxHoursPerDay})`,
        affectedEntryIds: data.entryIds,
        affectedUserIds: entries[0].userId ? [entries[0].userId] : undefined,
      })
    }
  }

  // Calculate weekly totals (assuming weeks start on Sunday)
  const totalHours = entries.reduce((sum, e) => sum + getShiftDuration(e), 0)

  if (totalHours > maxHoursPerWeek) {
    conflicts.push({
      type: 'OVERTIME',
      severity: 'warning',
      message: `${totalHours.toFixed(1)} hours scheduled this period (max: ${maxHoursPerWeek}/week)`,
      affectedEntryIds: entries.map(e => e.id),
      affectedUserIds: entries[0].userId ? [entries[0].userId] : undefined,
    })
  }

  return conflicts
}

/**
 * Detect conflicts with employee availability
 */
function detectAvailabilityConflicts(
  entries: ScheduleEntry[],
  availability: EmployeeAvailability[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  for (const entry of entries) {
    const entryDate = typeof entry.date === 'string'
      ? parseISO(entry.date.split('T')[0])
      : entry.date
    const dayOfWeek = getDay(entryDate)

    // Find relevant availability for this day
    const dayAvailability = availability.filter(a => {
      if (a.dayOfWeek !== dayOfWeek) return false

      // Check effective date range if specified
      if (a.effectiveFrom && entryDate < new Date(a.effectiveFrom)) return false
      if (a.effectiveTo && entryDate > new Date(a.effectiveTo)) return false

      return true
    })

    // Check if scheduled outside available times
    for (const avail of dayAvailability) {
      if (avail.preferenceLevel === AvailabilityPreference.UNAVAILABLE || !avail.isAvailable) {
        // Check if entry time overlaps with unavailable time
        const entryStart = entry.startTime
        const entryEnd = entry.endTime
        const availStart = avail.startTime
        const availEnd = avail.endTime

        // Simple time comparison (assumes same day)
        const entryStartMinutes = parseInt(entryStart.split(':')[0]) * 60 + parseInt(entryStart.split(':')[1])
        const entryEndMinutes = parseInt(entryEnd.split(':')[0]) * 60 + parseInt(entryEnd.split(':')[1])
        const availStartMinutes = parseInt(availStart.split(':')[0]) * 60 + parseInt(availStart.split(':')[1])
        const availEndMinutes = parseInt(availEnd.split(':')[0]) * 60 + parseInt(availEnd.split(':')[1])

        const overlaps = entryStartMinutes < availEndMinutes && entryEndMinutes > availStartMinutes

        if (overlaps) {
          conflicts.push({
            type: 'AVAILABILITY_CONFLICT',
            severity: 'warning',
            message: `Scheduled during marked unavailable time on ${format(entryDate, 'EEEE')}`,
            affectedEntryIds: [entry.id],
            affectedUserIds: entry.userId ? [entry.userId] : undefined,
          })
        }
      }
    }
  }

  return conflicts
}

/**
 * Detect conflicts with approved time-off requests
 */
function detectTimeOffConflicts(
  entries: ScheduleEntry[],
  timeOffRequests: TimeOffRequest[]
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  for (const entry of entries) {
    const entryDate = typeof entry.date === 'string'
      ? parseISO(entry.date.split('T')[0])
      : entry.date

    for (const request of timeOffRequests) {
      const startDate = new Date(request.startDate)
      const endDate = new Date(request.endDate)

      if (isWithinInterval(entryDate, { start: startDate, end: endDate })) {
        conflicts.push({
          type: 'TIME_OFF_CONFLICT',
          severity: 'error',
          message: `Scheduled during approved time off (${request.requestType.toLowerCase()})`,
          affectedEntryIds: [entry.id],
          affectedUserIds: entry.userId ? [entry.userId] : undefined,
        })
      }
    }
  }

  return conflicts
}

/**
 * Detect staffing level conflicts - understaffed or overstaffed
 */
function detectStaffingConflicts(
  entries: ScheduleEntry[],
  shift: ShiftDefinition,
  dateStr: string
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = []

  // Count filled positions (entries with userId assigned)
  const filledCount = entries.filter(e => e.userId && e.status !== 'CANCELLED').length

  if (filledCount < shift.minEmployees) {
    conflicts.push({
      type: 'UNDERSTAFFED',
      severity: 'warning',
      message: `${shift.name} on ${dateStr} has ${filledCount}/${shift.minEmployees} minimum staff`,
      affectedEntryIds: entries.map(e => e.id),
    })
  }

  if (shift.maxEmployees && filledCount > shift.maxEmployees) {
    conflicts.push({
      type: 'OVERSTAFFED',
      severity: 'warning',
      message: `${shift.name} on ${dateStr} has ${filledCount}/${shift.maxEmployees} maximum staff`,
      affectedEntryIds: entries.map(e => e.id),
    })
  }

  return conflicts
}

/**
 * Check for conflicts when adding/updating a single entry
 */
export function checkEntryConflicts(
  newEntry: Partial<ScheduleEntry> & { startTime: string; endTime: string; date: Date | string },
  existingEntries: ScheduleEntry[],
  timeOffRequests: TimeOffRequest[],
  availability: EmployeeAvailability[],
  settings: Partial<ConflictSettings> = {}
): ScheduleConflict[] {
  // Create a temporary entry object for checking
  const tempEntry: ScheduleEntry = {
    id: newEntry.id || 'temp',
    userId: newEntry.userId || null,
    shiftId: newEntry.shiftId || null,
    rinkId: newEntry.rinkId || null,
    facilityId: newEntry.facilityId || '',
    date: typeof newEntry.date === 'string' ? new Date(newEntry.date) : newEntry.date,
    startTime: newEntry.startTime,
    endTime: newEntry.endTime,
    breakMinutes: newEntry.breakMinutes || 0,
    notes: newEntry.notes || null,
    isOpenShift: newEntry.isOpenShift || false,
    isEmergency: newEntry.isEmergency || false,
    status: newEntry.status || 'DRAFT',
    waitlistUsers: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdById: newEntry.createdById || '',
    publishedAt: null,
    publishedById: null,
    hasConflict: false,
    conflictNotes: null,
  }

  // Filter existing entries to only include those for the same user (if assigned)
  const relevantEntries = tempEntry.userId
    ? existingEntries.filter(e => e.userId === tempEntry.userId && e.id !== tempEntry.id)
    : []

  // Combine with the new entry
  const allEntries = [...relevantEntries, tempEntry]

  return detectConflicts(allEntries, timeOffRequests, availability, [], settings)
}

/**
 * Get a human-readable summary of conflicts
 */
export function getConflictSummary(conflicts: ScheduleConflict[]): string {
  if (conflicts.length === 0) return 'No conflicts detected'

  const errorCount = conflicts.filter(c => c.severity === 'error').length
  const warningCount = conflicts.filter(c => c.severity === 'warning').length

  const parts: string[] = []
  if (errorCount > 0) parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`)
  if (warningCount > 0) parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`)

  return parts.join(', ')
}

/**
 * Group conflicts by type for display
 */
export function groupConflictsByType(conflicts: ScheduleConflict[]): Map<ConflictType, ScheduleConflict[]> {
  const grouped = new Map<ConflictType, ScheduleConflict[]>()

  for (const conflict of conflicts) {
    const existing = grouped.get(conflict.type) || []
    existing.push(conflict)
    grouped.set(conflict.type, existing)
  }

  return grouped
}
