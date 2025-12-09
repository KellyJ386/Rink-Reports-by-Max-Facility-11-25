// Shift Conflict Detection System
// Comprehensive conflict detection for schedule management

import type { Shift, Availability, ShiftAssignment } from '@/types/schedule'
import { parseTime, timesOverlap, isSameDay, parseDate } from '@/lib/schedule-utils'

// ============================================================================
// CONFLICT TYPES
// ============================================================================

export type ConflictType =
  | 'DOUBLE_BOOKING'
  | 'OVERLAP'
  | 'INSUFFICIENT_REST'
  | 'MAX_HOURS_EXCEEDED'
  | 'UNAVAILABLE'
  | 'ROLE_MISMATCH'
  | 'MINIMUM_STAFF'
  | 'MAXIMUM_STAFF'

export type ConflictSeverity = 'ERROR' | 'WARNING' | 'INFO'

export interface ShiftConflict {
  id: string
  type: ConflictType
  severity: ConflictSeverity
  message: string
  description: string
  shiftId: string
  affectedShiftIds?: string[]
  employeeId?: string
  employeeName?: string
  suggestions?: string[]
  resolvable: boolean
  autoResolve?: () => void
}

export interface ConflictCheckResult {
  hasConflicts: boolean
  hasErrors: boolean
  hasWarnings: boolean
  conflicts: ShiftConflict[]
  summary: {
    errors: number
    warnings: number
    info: number
  }
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Check all conflicts for a single shift
 */
export function checkShiftConflicts(
  shift: Shift,
  allShifts: Shift[],
  employeeAvailability?: Map<string, Availability[]>,
  config?: ConflictConfig
): ShiftConflict[] {
  const conflicts: ShiftConflict[] = []

  // Check staffing levels
  conflicts.push(...checkStaffingConflicts(shift))

  // Check employee conflicts
  for (const assignment of shift.assignedEmployees) {
    if (assignment.status !== 'ASSIGNED' && assignment.status !== 'CONFIRMED') continue

    // Check for double-booking
    const doubleBooking = checkDoubleBooking(shift, allShifts, assignment.employeeId)
    if (doubleBooking) conflicts.push(doubleBooking)

    // Check for insufficient rest between shifts
    const restConflicts = checkRestPeriod(shift, allShifts, assignment.employeeId, config)
    conflicts.push(...restConflicts)

    // Check for max hours exceeded
    const hoursConflict = checkMaxHours(shift, allShifts, assignment.employeeId, config)
    if (hoursConflict) conflicts.push(hoursConflict)

    // Check availability
    if (employeeAvailability) {
      const availability = employeeAvailability.get(assignment.employeeId)
      if (availability) {
        const availConflict = checkAvailability(shift, availability, assignment)
        if (availConflict) conflicts.push(availConflict)
      }
    }

    // Check role requirements
    const roleConflict = checkRoleRequirements(shift, assignment)
    if (roleConflict) conflicts.push(roleConflict)
  }

  return conflicts
}

/**
 * Check all conflicts for a schedule
 */
export function checkScheduleConflicts(
  shifts: Shift[],
  employeeAvailability?: Map<string, Availability[]>,
  config?: ConflictConfig
): ConflictCheckResult {
  const allConflicts: ShiftConflict[] = []

  for (const shift of shifts) {
    const shiftConflicts = checkShiftConflicts(shift, shifts, employeeAvailability, config)
    allConflicts.push(...shiftConflicts)
  }

  // Deduplicate conflicts (same conflict might be found from multiple shifts)
  const uniqueConflicts = deduplicateConflicts(allConflicts)

  return {
    hasConflicts: uniqueConflicts.length > 0,
    hasErrors: uniqueConflicts.some(c => c.severity === 'ERROR'),
    hasWarnings: uniqueConflicts.some(c => c.severity === 'WARNING'),
    conflicts: uniqueConflicts,
    summary: {
      errors: uniqueConflicts.filter(c => c.severity === 'ERROR').length,
      warnings: uniqueConflicts.filter(c => c.severity === 'WARNING').length,
      info: uniqueConflicts.filter(c => c.severity === 'INFO').length,
    },
  }
}

/**
 * Quick check if an employee can be assigned to a shift
 */
export function canAssignEmployee(
  shift: Shift,
  employeeId: string,
  allShifts: Shift[],
  employeeAvailability?: Availability[]
): { canAssign: boolean; conflicts: ShiftConflict[] } {
  const conflicts: ShiftConflict[] = []

  // Check double booking
  const doubleBooking = checkDoubleBooking(shift, allShifts, employeeId)
  if (doubleBooking) conflicts.push(doubleBooking)

  // Check rest period
  const restConflicts = checkRestPeriod(shift, allShifts, employeeId)
  conflicts.push(...restConflicts)

  // Check availability
  if (employeeAvailability) {
    const mockAssignment: ShiftAssignment = {
      id: 'temp',
      shiftId: shift.id,
      employeeId,
      status: 'ASSIGNED',
      assignedAt: new Date().toISOString(),
      employee: { id: employeeId, firstName: '', lastName: '', email: '', role: '' },
    }
    const availConflict = checkAvailability(shift, employeeAvailability, mockAssignment)
    if (availConflict) conflicts.push(availConflict)
  }

  // Check max staff
  if (shift.assignedEmployees.length >= shift.maxStaff) {
    conflicts.push({
      id: `max-staff-${shift.id}`,
      type: 'MAXIMUM_STAFF',
      severity: 'ERROR',
      message: 'Maximum staff reached',
      description: `This shift already has ${shift.maxStaff} employees assigned.`,
      shiftId: shift.id,
      resolvable: false,
    })
  }

  return {
    canAssign: !conflicts.some(c => c.severity === 'ERROR'),
    conflicts,
  }
}

// ============================================================================
// SPECIFIC CONFLICT CHECKS
// ============================================================================

interface ConflictConfig {
  minRestHours?: number
  maxDailyHours?: number
  maxWeeklyHours?: number
}

const DEFAULT_CONFIG: ConflictConfig = {
  minRestHours: 8,
  maxDailyHours: 12,
  maxWeeklyHours: 48,
}

/**
 * Check for double booking (same employee assigned to overlapping shifts)
 */
function checkDoubleBooking(
  shift: Shift,
  allShifts: Shift[],
  employeeId: string
): ShiftConflict | null {
  for (const otherShift of allShifts) {
    if (otherShift.id === shift.id) continue
    if (otherShift.date !== shift.date) continue

    const isAssigned = otherShift.assignedEmployees.some(
      a => a.employeeId === employeeId &&
           (a.status === 'ASSIGNED' || a.status === 'CONFIRMED')
    )

    if (!isAssigned) continue

    if (timesOverlap(shift.startTime, shift.endTime, otherShift.startTime, otherShift.endTime)) {
      return {
        id: `double-booking-${shift.id}-${otherShift.id}-${employeeId}`,
        type: 'DOUBLE_BOOKING',
        severity: 'ERROR',
        message: 'Double booking detected',
        description: `Employee is already assigned to an overlapping shift (${otherShift.title}) from ${otherShift.startTime} to ${otherShift.endTime}.`,
        shiftId: shift.id,
        affectedShiftIds: [otherShift.id],
        employeeId,
        suggestions: [
          'Remove the employee from one of the conflicting shifts',
          'Adjust shift times to avoid overlap',
        ],
        resolvable: true,
      }
    }
  }

  return null
}

/**
 * Check minimum rest period between shifts
 */
function checkRestPeriod(
  shift: Shift,
  allShifts: Shift[],
  employeeId: string,
  config: ConflictConfig = DEFAULT_CONFIG
): ShiftConflict[] {
  const conflicts: ShiftConflict[] = []
  const minRestHours = config.minRestHours || 8

  const shiftDate = parseDate(shift.date)
  const shiftStartMinutes = parseTime(shift.startTime)
  const shiftEndMinutes = parseTime(shift.endTime)

  for (const otherShift of allShifts) {
    if (otherShift.id === shift.id) continue

    const isAssigned = otherShift.assignedEmployees.some(
      a => a.employeeId === employeeId &&
           (a.status === 'ASSIGNED' || a.status === 'CONFIRMED')
    )

    if (!isAssigned) continue

    const otherDate = parseDate(otherShift.date)
    const dayDiff = Math.abs(shiftDate.getTime() - otherDate.getTime()) / (1000 * 60 * 60 * 24)

    // Only check shifts within 1 day
    if (dayDiff > 1) continue

    const otherStartMinutes = parseTime(otherShift.startTime)
    const otherEndMinutes = parseTime(otherShift.endTime)

    // Calculate rest period
    let restMinutes: number

    if (otherDate < shiftDate || (isSameDay(otherDate, shiftDate) && otherEndMinutes <= shiftStartMinutes)) {
      // Other shift is before this shift
      let endTime = otherEndMinutes
      if (otherDate < shiftDate) endTime -= 24 * 60
      restMinutes = shiftStartMinutes - endTime
      if (otherDate < shiftDate) restMinutes += 24 * 60
    } else if (otherDate > shiftDate || (isSameDay(otherDate, shiftDate) && otherStartMinutes >= shiftEndMinutes)) {
      // Other shift is after this shift
      let startTime = otherStartMinutes
      if (otherDate > shiftDate) startTime += 24 * 60
      restMinutes = startTime - shiftEndMinutes
    } else {
      continue // Overlapping, handled by double booking check
    }

    const restHours = restMinutes / 60

    if (restHours < minRestHours && restHours >= 0) {
      conflicts.push({
        id: `rest-period-${shift.id}-${otherShift.id}-${employeeId}`,
        type: 'INSUFFICIENT_REST',
        severity: 'WARNING',
        message: 'Insufficient rest period',
        description: `Only ${restHours.toFixed(1)} hours rest between shifts (minimum ${minRestHours} hours recommended).`,
        shiftId: shift.id,
        affectedShiftIds: [otherShift.id],
        employeeId,
        suggestions: [
          'Adjust shift times to provide adequate rest',
          'Consider assigning a different employee',
        ],
        resolvable: true,
      })
    }
  }

  return conflicts
}

/**
 * Check maximum hours limits
 */
function checkMaxHours(
  shift: Shift,
  allShifts: Shift[],
  employeeId: string,
  config: ConflictConfig = DEFAULT_CONFIG
): ShiftConflict | null {
  const maxWeeklyHours = config.maxWeeklyHours || 48

  // Calculate weekly hours including this shift
  const shiftDate = parseDate(shift.date)
  const weekStart = new Date(shiftDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  let totalHours = calculateShiftDuration(shift)

  for (const otherShift of allShifts) {
    if (otherShift.id === shift.id) continue

    const otherDate = parseDate(otherShift.date)
    if (otherDate < weekStart || otherDate > weekEnd) continue

    const isAssigned = otherShift.assignedEmployees.some(
      a => a.employeeId === employeeId &&
           (a.status === 'ASSIGNED' || a.status === 'CONFIRMED')
    )

    if (isAssigned) {
      totalHours += calculateShiftDuration(otherShift)
    }
  }

  if (totalHours > maxWeeklyHours) {
    return {
      id: `max-hours-${shift.id}-${employeeId}`,
      type: 'MAX_HOURS_EXCEEDED',
      severity: 'WARNING',
      message: 'Maximum weekly hours exceeded',
      description: `Assigning this shift would result in ${totalHours.toFixed(1)} hours this week (max ${maxWeeklyHours}).`,
      shiftId: shift.id,
      employeeId,
      suggestions: [
        'Consider assigning a different employee',
        'Reduce hours on other shifts this week',
      ],
      resolvable: true,
    }
  }

  return null
}

/**
 * Check employee availability
 */
function checkAvailability(
  shift: Shift,
  availability: Availability[],
  assignment: ShiftAssignment
): ShiftConflict | null {
  const dayAvailability = availability.filter(a => a.date === shift.date)

  for (const avail of dayAvailability) {
    if (avail.type === 'UNAVAILABLE') {
      if (avail.allDay) {
        return {
          id: `unavailable-${shift.id}-${assignment.employeeId}`,
          type: 'UNAVAILABLE',
          severity: 'ERROR',
          message: 'Employee unavailable',
          description: `Employee marked as unavailable for this day${avail.reason ? `: ${avail.reason}` : ''}.`,
          shiftId: shift.id,
          employeeId: assignment.employeeId,
          employeeName: `${assignment.employee.firstName} ${assignment.employee.lastName}`,
          resolvable: true,
          suggestions: ['Assign a different employee', 'Check with employee about availability change'],
        }
      }

      if (avail.startTime && avail.endTime) {
        if (timesOverlap(shift.startTime, shift.endTime, avail.startTime, avail.endTime)) {
          return {
            id: `unavailable-partial-${shift.id}-${assignment.employeeId}`,
            type: 'UNAVAILABLE',
            severity: 'ERROR',
            message: 'Employee unavailable during shift time',
            description: `Employee unavailable from ${avail.startTime} to ${avail.endTime}${avail.reason ? `: ${avail.reason}` : ''}.`,
            shiftId: shift.id,
            employeeId: assignment.employeeId,
            resolvable: true,
          }
        }
      }
    }
  }

  return null
}

/**
 * Check role requirements
 */
function checkRoleRequirements(
  shift: Shift,
  assignment: ShiftAssignment
): ShiftConflict | null {
  if (!shift.requiredRoles || shift.requiredRoles.length === 0) {
    return null
  }

  const employeeRole = assignment.employee.role

  if (!shift.requiredRoles.includes(employeeRole)) {
    return {
      id: `role-mismatch-${shift.id}-${assignment.employeeId}`,
      type: 'ROLE_MISMATCH',
      severity: 'WARNING',
      message: 'Role requirement not met',
      description: `Employee role (${employeeRole}) doesn't match required roles: ${shift.requiredRoles.join(', ')}.`,
      shiftId: shift.id,
      employeeId: assignment.employeeId,
      resolvable: true,
      suggestions: ['Assign an employee with the required role', 'Review role requirements for this shift'],
    }
  }

  return null
}

/**
 * Check staffing levels
 */
function checkStaffingConflicts(shift: Shift): ShiftConflict[] {
  const conflicts: ShiftConflict[] = []
  const assignedCount = shift.assignedEmployees.filter(
    a => a.status === 'ASSIGNED' || a.status === 'CONFIRMED'
  ).length

  if (assignedCount < shift.minStaff) {
    conflicts.push({
      id: `understaffed-${shift.id}`,
      type: 'MINIMUM_STAFF',
      severity: 'WARNING',
      message: 'Shift understaffed',
      description: `Only ${assignedCount} of ${shift.minStaff} minimum staff assigned.`,
      shiftId: shift.id,
      resolvable: true,
      suggestions: ['Add more employees to this shift', 'Consider posting as an open shift'],
    })
  }

  return conflicts
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateShiftDuration(shift: Shift): number {
  const startMinutes = parseTime(shift.startTime)
  let endMinutes = parseTime(shift.endTime)

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60 // Overnight shift
  }

  return (endMinutes - startMinutes - (shift.breakDuration || 0)) / 60
}

function deduplicateConflicts(conflicts: ShiftConflict[]): ShiftConflict[] {
  const seen = new Set<string>()
  return conflicts.filter(c => {
    if (seen.has(c.id)) return false
    seen.add(c.id)
    return true
  })
}

// ============================================================================
// CONFLICT RESOLUTION SUGGESTIONS
// ============================================================================

export function getConflictResolutionSuggestions(conflict: ShiftConflict): string[] {
  const baseMessages: Record<ConflictType, string[]> = {
    DOUBLE_BOOKING: [
      'Remove the employee from one of the overlapping shifts',
      'Adjust shift times to eliminate the overlap',
      'Split the shift into non-overlapping segments',
    ],
    OVERLAP: [
      'Adjust shift start or end times',
      'Reassign employees to avoid overlap',
    ],
    INSUFFICIENT_REST: [
      'Provide at least 8 hours between shifts',
      'Assign a different employee to one of the shifts',
      'Consider combining consecutive short shifts',
    ],
    MAX_HOURS_EXCEEDED: [
      'Reduce hours on other shifts this week',
      'Assign a different employee',
      'Request overtime approval if necessary',
    ],
    UNAVAILABLE: [
      'Assign a different employee',
      'Check if the employee can update their availability',
      'Consider rescheduling the shift',
    ],
    ROLE_MISMATCH: [
      'Assign an employee with the required role',
      'Update the employee\'s role if they have the necessary skills',
      'Review and update shift role requirements',
    ],
    MINIMUM_STAFF: [
      'Assign additional employees to meet minimum requirements',
      'Post the shift as open for volunteers',
      'Contact available employees directly',
    ],
    MAXIMUM_STAFF: [
      'Remove an employee from the shift',
      'Increase the maximum staff limit if appropriate',
      'Reassign employees to understaffed shifts',
    ],
  }

  return conflict.suggestions || baseMessages[conflict.type] || []
}

export function getConflictSeverityColor(severity: ConflictSeverity): string {
  switch (severity) {
    case 'ERROR':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'WARNING':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    case 'INFO':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}
