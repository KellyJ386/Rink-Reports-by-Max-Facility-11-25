import {
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addDays,
  addWeeks,
  isSameDay,
  isWithinInterval,
  differenceInMinutes,
} from 'date-fns'
import {
  ScheduleEntry,
  ShiftDefinition,
  RecurringShift,
  ScheduleTemplate,
  TimeOffRequest,
  EmployeeAvailability,
  ScheduleStatus,
} from '@prisma/client'
import {
  CalendarDay,
  CalendarWeek,
  ScheduleEntryWithUser,
  TemplateShiftConfig,
} from '@/types/schedule'

/**
 * Generate calendar data for a given month
 */
export function generateMonthCalendar(
  year: number,
  month: number,
  entries: ScheduleEntryWithUser[],
  timeOffRequests: TimeOffRequest[]
): CalendarWeek[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = endOfMonth(firstDay)

  // Get the calendar range (including days from adjacent months)
  const calendarStart = startOfWeek(firstDay, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(lastDay, { weekStartsOn: 0 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const today = new Date()

  const weeks: CalendarWeek[] = []
  let currentWeek: CalendarDay[] = []

  for (let i = 0; i < days.length; i++) {
    const date = days[i]
    const dateStr = format(date, 'yyyy-MM-dd')

    // Get entries for this day
    const dayEntries = entries.filter(entry => {
      const entryDate = typeof entry.date === 'string'
        ? entry.date.split('T')[0]
        : format(entry.date, 'yyyy-MM-dd')
      return entryDate === dateStr
    })

    // Get time-off requests that include this day
    const dayTimeOff = timeOffRequests.filter(request => {
      const startDate = new Date(request.startDate)
      const endDate = new Date(request.endDate)
      return isWithinInterval(date, { start: startDate, end: endDate })
    })

    currentWeek.push({
      date: dateStr,
      dayOfWeek: getDay(date),
      isToday: isSameDay(date, today),
      isCurrentMonth: date.getMonth() === month,
      entries: dayEntries,
      conflicts: [], // Will be populated by conflict detection
      timeOffRequests: dayTimeOff,
    })

    // Start new week
    if (currentWeek.length === 7) {
      weeks.push({
        weekNumber: weeks.length + 1,
        startDate: format(currentWeek[0].date, 'yyyy-MM-dd'),
        endDate: format(currentWeek[6].date, 'yyyy-MM-dd'),
        days: currentWeek,
      })
      currentWeek = []
    }
  }

  return weeks
}

/**
 * Generate week calendar data
 */
export function generateWeekCalendar(
  startDate: Date,
  entries: ScheduleEntryWithUser[],
  timeOffRequests: TimeOffRequest[]
): CalendarDay[] {
  const weekStart = startOfWeek(startDate, { weekStartsOn: 0 })
  const days: CalendarDay[] = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i)
    const dateStr = format(date, 'yyyy-MM-dd')

    const dayEntries = entries.filter(entry => {
      const entryDate = typeof entry.date === 'string'
        ? entry.date.split('T')[0]
        : format(entry.date, 'yyyy-MM-dd')
      return entryDate === dateStr
    })

    const dayTimeOff = timeOffRequests.filter(request => {
      const startDate = new Date(request.startDate)
      const endDate = new Date(request.endDate)
      return isWithinInterval(date, { start: startDate, end: endDate })
    })

    days.push({
      date: dateStr,
      dayOfWeek: i,
      isToday: isSameDay(date, today),
      isCurrentMonth: true,
      entries: dayEntries,
      conflicts: [],
      timeOffRequests: dayTimeOff,
    })
  }

  return days
}

/**
 * Generate schedule entries from recurring shifts
 */
export function generateEntriesFromRecurring(
  recurringShifts: (RecurringShift & { shift: ShiftDefinition })[],
  startDate: Date,
  endDate: Date,
  facilityId: string,
  createdById: string
): Partial<ScheduleEntry>[] {
  const entries: Partial<ScheduleEntry>[] = []
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  for (const recurring of recurringShifts) {
    if (!recurring.isActive) continue

    // Check date range
    const recurringStart = new Date(recurring.startDate)
    const recurringEnd = recurring.endDate ? new Date(recurring.endDate) : null

    for (const date of days) {
      // Check if this day matches the day of week
      if (getDay(date) !== recurring.dayOfWeek) continue

      // Check if within recurring shift's date range
      if (date < recurringStart) continue
      if (recurringEnd && date > recurringEnd) continue

      entries.push({
        userId: recurring.userId,
        shiftId: recurring.shiftId,
        facilityId,
        date,
        startTime: recurring.startTime || recurring.shift.startTime,
        endTime: recurring.endTime || recurring.shift.endTime,
        breakMinutes: recurring.shift.breakMinutes,
        isOpenShift: !recurring.userId,
        status: ScheduleStatus.DRAFT,
        createdById,
      })
    }
  }

  return entries
}

/**
 * Generate schedule entries from a template
 */
export function generateEntriesFromTemplate(
  template: ScheduleTemplate,
  startDate: Date,
  endDate: Date,
  shifts: ShiftDefinition[],
  facilityId: string,
  createdById: string
): Partial<ScheduleEntry>[] {
  const entries: Partial<ScheduleEntry>[] = []
  const templateData = template.templateData as TemplateShiftConfig[]
  const shiftsMap = new Map(shifts.map(s => [s.id, s]))
  const days = eachDayOfInterval({ start: startDate, end: endDate })

  for (const config of templateData) {
    const shift = shiftsMap.get(config.shiftId)
    if (!shift) continue

    for (const date of days) {
      if (getDay(date) !== config.dayOfWeek) continue

      // Create entries based on minStaff
      const staffCount = config.userId ? 1 : config.minStaff

      for (let i = 0; i < staffCount; i++) {
        entries.push({
          userId: i === 0 ? config.userId : null,
          shiftId: config.shiftId,
          facilityId,
          date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          breakMinutes: shift.breakMinutes,
          notes: config.notes || null,
          isOpenShift: !config.userId || i > 0,
          status: ScheduleStatus.DRAFT,
          createdById,
        })
      }
    }
  }

  return entries
}

/**
 * Calculate total hours for a set of entries
 */
export function calculateTotalHours(entries: ScheduleEntry[]): number {
  return entries.reduce((total, entry) => {
    const [startHour, startMin] = entry.startTime.split(':').map(Number)
    const [endHour, endMin] = entry.endTime.split(':').map(Number)

    let minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
    if (minutes < 0) minutes += 24 * 60 // Handle overnight

    minutes -= entry.breakMinutes || 0
    return total + minutes / 60
  }, 0)
}

/**
 * Calculate hours by day of week
 */
export function calculateHoursByDay(entries: ScheduleEntry[]): Map<number, number> {
  const hoursByDay = new Map<number, number>()

  for (const entry of entries) {
    const date = typeof entry.date === 'string' ? parseISO(entry.date) : entry.date
    const dayOfWeek = getDay(date)

    const [startHour, startMin] = entry.startTime.split(':').map(Number)
    const [endHour, endMin] = entry.endTime.split(':').map(Number)

    let minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
    if (minutes < 0) minutes += 24 * 60

    minutes -= entry.breakMinutes || 0
    const hours = minutes / 60

    hoursByDay.set(dayOfWeek, (hoursByDay.get(dayOfWeek) || 0) + hours)
  }

  return hoursByDay
}

/**
 * Get available employees for a shift based on availability
 */
export function getAvailableEmployees(
  date: Date,
  startTime: string,
  endTime: string,
  employees: { id: string; availability: EmployeeAvailability[] }[],
  existingEntries: ScheduleEntry[],
  timeOffRequests: TimeOffRequest[]
): string[] {
  const dayOfWeek = getDay(date)
  const dateStr = format(date, 'yyyy-MM-dd')

  return employees
    .filter(employee => {
      // Check availability
      const dayAvailability = employee.availability.filter(a => {
        if (a.dayOfWeek !== dayOfWeek) return false
        if (a.effectiveFrom && date < new Date(a.effectiveFrom)) return false
        if (a.effectiveTo && date > new Date(a.effectiveTo)) return false
        return true
      })

      // If no availability set, assume available
      if (dayAvailability.length === 0) return true

      // Check if any availability slot covers the shift
      const shiftStartMin = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
      const shiftEndMin = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1])

      const isAvailable = dayAvailability.some(a => {
        if (!a.isAvailable) return false
        const availStartMin = parseInt(a.startTime.split(':')[0]) * 60 + parseInt(a.startTime.split(':')[1])
        const availEndMin = parseInt(a.endTime.split(':')[0]) * 60 + parseInt(a.endTime.split(':')[1])
        return availStartMin <= shiftStartMin && availEndMin >= shiftEndMin
      })

      if (!isAvailable) return false

      // Check time-off
      const hasTimeOff = timeOffRequests.some(request => {
        if (request.userId !== employee.id) return false
        if (request.status !== 'APPROVED') return false
        const startDate = new Date(request.startDate)
        const endDate = new Date(request.endDate)
        return isWithinInterval(date, { start: startDate, end: endDate })
      })

      if (hasTimeOff) return false

      // Check not already scheduled (double booking)
      const alreadyScheduled = existingEntries.some(entry => {
        if (entry.userId !== employee.id) return false
        const entryDateStr = typeof entry.date === 'string'
          ? entry.date.split('T')[0]
          : format(entry.date, 'yyyy-MM-dd')
        if (entryDateStr !== dateStr) return false

        // Check time overlap
        const entryStartMin = parseInt(entry.startTime.split(':')[0]) * 60 + parseInt(entry.startTime.split(':')[1])
        const entryEndMin = parseInt(entry.endTime.split(':')[0]) * 60 + parseInt(entry.endTime.split(':')[1])

        return shiftStartMin < entryEndMin && shiftEndMin > entryStartMin
      })

      return !alreadyScheduled
    })
    .map(e => e.id)
}

/**
 * Format time display (e.g., "6:00 AM")
 */
export function formatTime(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 || 12
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Format shift duration (e.g., "8h 30m")
 */
export function formatDuration(startTime: string, endTime: string, breakMinutes: number = 0): string {
  const [startHour, startMin] = startTime.split(':').map(Number)
  const [endHour, endMin] = endTime.split(':').map(Number)

  let totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin)
  if (totalMinutes < 0) totalMinutes += 24 * 60

  totalMinutes -= breakMinutes

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/**
 * Get shift color based on type or use default
 */
export function getShiftColor(shift: ShiftDefinition | null, defaultColor: string = '#3B82F6'): string {
  if (!shift) return defaultColor
  return shift.color || defaultColor
}

/**
 * Check if a time falls within a shift
 */
export function isTimeInShift(time: string, shiftStart: string, shiftEnd: string): boolean {
  const [timeH, timeM] = time.split(':').map(Number)
  const [startH, startM] = shiftStart.split(':').map(Number)
  const [endH, endM] = shiftEnd.split(':').map(Number)

  const timeMinutes = timeH * 60 + timeM
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM

  // Handle overnight shifts
  if (endMinutes < startMinutes) {
    return timeMinutes >= startMinutes || timeMinutes <= endMinutes
  }

  return timeMinutes >= startMinutes && timeMinutes <= endMinutes
}

/**
 * Generate time slots for a day (e.g., every 30 minutes)
 */
export function generateTimeSlots(intervalMinutes: number = 30): string[] {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
    }
  }
  return slots
}

/**
 * Get week date range string
 */
export function getWeekRangeString(date: Date): string {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 })

  const startMonth = format(weekStart, 'MMM')
  const endMonth = format(weekEnd, 'MMM')
  const startDay = format(weekStart, 'd')
  const endDay = format(weekEnd, 'd')
  const year = format(weekEnd, 'yyyy')

  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} - ${endDay}, ${year}`
  }
  return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`
}

/**
 * Copy entries from one week to another
 */
export function copyWeekEntries(
  entries: ScheduleEntry[],
  fromWeekStart: Date,
  toWeekStart: Date,
  createdById: string
): Partial<ScheduleEntry>[] {
  const daysDiff = Math.round((toWeekStart.getTime() - fromWeekStart.getTime()) / (1000 * 60 * 60 * 24))

  return entries.map(entry => {
    const originalDate = typeof entry.date === 'string' ? parseISO(entry.date) : entry.date
    const newDate = addDays(originalDate, daysDiff)

    return {
      userId: entry.userId,
      shiftId: entry.shiftId,
      rinkId: entry.rinkId,
      facilityId: entry.facilityId,
      date: newDate,
      startTime: entry.startTime,
      endTime: entry.endTime,
      breakMinutes: entry.breakMinutes,
      notes: entry.notes,
      isOpenShift: entry.isOpenShift,
      isEmergency: entry.isEmergency,
      status: ScheduleStatus.DRAFT,
      createdById,
    }
  })
}
