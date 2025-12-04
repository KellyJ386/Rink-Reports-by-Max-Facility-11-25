'use client'

import { useState, useMemo } from 'react'
import type { Shift, ShiftTemplate, CalendarWeek } from '@/types/schedule'
import {
  generateCalendarWeek,
  formatDate,
  formatDateDisplay,
  getDayName,
  getTimeSlots,
  parseTime,
  addDays,
  getWeekStart,
} from '@/lib/schedule-utils'
import { ShiftCard } from './ShiftCard'

interface CalendarWeekViewProps {
  currentDate: Date
  shifts: Shift[]
  templates?: ShiftTemplate[]
  onDateChange?: (date: Date) => void
  onShiftClick?: (shift: Shift) => void
  onShiftEdit?: (shift: Shift) => void
  onShiftDelete?: (shift: Shift) => void
  onCreateShift?: (date: string, startTime?: string) => void
  onDropTemplate?: (template: ShiftTemplate, date: string) => void
  readOnly?: boolean
  showTimeSlots?: boolean
  startHour?: number
  endHour?: number
}

export function CalendarWeekView({
  currentDate,
  shifts,
  templates = [],
  onDateChange,
  onShiftClick,
  onShiftEdit,
  onShiftDelete,
  onCreateShift,
  onDropTemplate,
  readOnly = false,
  showTimeSlots = true,
  startHour = 6,
  endHour = 22,
}: CalendarWeekViewProps) {
  const [dragOverCell, setDragOverCell] = useState<string | null>(null)

  const week = useMemo(() => {
    return generateCalendarWeek(currentDate, shifts)
  }, [currentDate, shifts])

  const timeSlots = useMemo(() => {
    return getTimeSlots(startHour, endHour, 60)
  }, [startHour, endHour])

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7
    onDateChange?.(addDays(currentDate, days))
  }

  const goToToday = () => {
    onDateChange?.(new Date())
  }

  const handleDragOver = (e: React.DragEvent, date: string) => {
    e.preventDefault()
    setDragOverCell(date)
  }

  const handleDragLeave = () => {
    setDragOverCell(null)
  }

  const handleDrop = (e: React.DragEvent, date: string) => {
    e.preventDefault()
    setDragOverCell(null)

    const templateId = e.dataTransfer.getData('templateId')
    if (templateId && onDropTemplate) {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        onDropTemplate(template, date)
      }
    }
  }

  const handleCellClick = (date: string, time?: string) => {
    if (!readOnly && onCreateShift) {
      onCreateShift(date, time)
    }
  }

  // Get shifts for a specific day and time slot
  const getShiftsForSlot = (date: string, slotTime: string): Shift[] => {
    const slotMinutes = parseTime(slotTime)
    return shifts.filter(shift => {
      if (shift.date !== date) return false
      const shiftStart = parseTime(shift.startTime)
      const shiftEnd = parseTime(shift.endTime)
      // Check if this shift overlaps with this time slot
      return shiftStart <= slotMinutes && slotMinutes < shiftEnd
    })
  }

  // Get all shifts for a day (for non-time-slot view)
  const getShiftsForDay = (date: string): Shift[] => {
    return shifts.filter(shift => shift.date === date)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Previous week"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Next week"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {formatDateDisplay(week.startDate, 'medium')} - {formatDateDisplay(week.endDate, 'medium')}
          </h2>
        </div>

        <div className="text-sm text-gray-500">
          Week {week.weekNumber}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className={`grid ${showTimeSlots ? 'grid-cols-8' : 'grid-cols-7'} border-b`}>
            {showTimeSlots && <div className="w-16" />}
            {week.days.map(day => (
              <div
                key={day.date}
                className={`px-2 py-3 text-center border-l first:border-l-0 ${
                  day.isToday ? 'bg-blue-50' : day.isWeekend ? 'bg-gray-50' : ''
                }`}
              >
                <div className="text-xs text-gray-500 uppercase">
                  {getDayName(day.dayOfWeek)}
                </div>
                <div className={`text-lg font-semibold ${
                  day.isToday ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {new Date(day.date).getDate()}
                </div>
                {day.shifts.length > 0 && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {day.shifts.length} shift{day.shifts.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Time Slots Grid (if enabled) */}
          {showTimeSlots ? (
            <div className="max-h-[600px] overflow-y-auto">
              {timeSlots.map((time, timeIdx) => (
                <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                  {/* Time label */}
                  <div className="w-16 px-2 py-2 text-xs text-gray-500 text-right border-r bg-gray-50">
                    {parseInt(time.split(':')[0]) % 12 || 12}:00 {parseInt(time.split(':')[0]) >= 12 ? 'PM' : 'AM'}
                  </div>

                  {/* Day cells */}
                  {week.days.map(day => {
                    const slotShifts = getShiftsForSlot(day.date, time)
                    const isDragOver = dragOverCell === `${day.date}-${time}`

                    return (
                      <div
                        key={`${day.date}-${time}`}
                        className={`min-h-[60px] p-1 border-l first:border-l-0 transition-colors ${
                          day.isToday ? 'bg-blue-50/30' : day.isWeekend ? 'bg-gray-50/50' : ''
                        } ${isDragOver ? 'bg-blue-100' : ''} ${
                          !readOnly ? 'cursor-pointer hover:bg-gray-50' : ''
                        }`}
                        onClick={() => handleCellClick(day.date, time)}
                        onDragOver={(e) => handleDragOver(e, `${day.date}-${time}`)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day.date)}
                      >
                        {/* Only show shift on its start hour */}
                        {slotShifts.filter(s => s.startTime.startsWith(time.split(':')[0])).map(shift => (
                          <ShiftCard
                            key={shift.id}
                            shift={shift}
                            variant="compact"
                            onClick={() => onShiftClick?.(shift)}
                            onEdit={!readOnly ? () => onShiftEdit?.(shift) : undefined}
                            onDelete={!readOnly ? () => onShiftDelete?.(shift) : undefined}
                            draggable={!readOnly}
                          />
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ) : (
            /* Simple day columns without time slots */
            <div className="grid grid-cols-7 min-h-[400px]">
              {week.days.map(day => {
                const dayShifts = getShiftsForDay(day.date)
                const isDragOver = dragOverCell === day.date

                return (
                  <div
                    key={day.date}
                    className={`p-2 border-l first:border-l-0 ${
                      day.isToday ? 'bg-blue-50/30' : day.isWeekend ? 'bg-gray-50/50' : ''
                    } ${isDragOver ? 'bg-blue-100' : ''} ${
                      !readOnly ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => handleCellClick(day.date)}
                    onDragOver={(e) => handleDragOver(e, day.date)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, day.date)}
                  >
                    <div className="space-y-2">
                      {dayShifts.map(shift => (
                        <ShiftCard
                          key={shift.id}
                          shift={shift}
                          variant="compact"
                          onClick={() => onShiftClick?.(shift)}
                          onEdit={!readOnly ? () => onShiftEdit?.(shift) : undefined}
                          onDelete={!readOnly ? () => onShiftDelete?.(shift) : undefined}
                          draggable={!readOnly}
                        />
                      ))}

                      {!readOnly && dayShifts.length === 0 && (
                        <div className="h-full min-h-[100px] flex items-center justify-center text-gray-400 text-sm">
                          <span className="opacity-0 hover:opacity-100 transition-opacity">+ Add shift</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Template Palette (if templates provided) */}
      {templates.length > 0 && !readOnly && (
        <div className="px-4 py-3 border-t bg-gray-50">
          <div className="text-xs text-gray-500 mb-2">Drag templates to add shifts:</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {templates.map(template => (
              <div
                key={template.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('templateId', template.id)
                }}
                className="flex-shrink-0 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing text-white text-sm font-medium transition-transform hover:scale-105"
                style={{ backgroundColor: template.color }}
              >
                {template.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Week view with employee rows (timeline style)
export function CalendarWeekTimelineView({
  currentDate,
  shifts,
  employees,
  onDateChange,
  onShiftClick,
  onShiftEdit,
  readOnly = false,
}: {
  currentDate: Date
  shifts: Shift[]
  employees: Array<{ id: string; firstName: string; lastName: string; role: string }>
  onDateChange?: (date: Date) => void
  onShiftClick?: (shift: Shift) => void
  onShiftEdit?: (shift: Shift) => void
  readOnly?: boolean
}) {
  const week = useMemo(() => {
    return generateCalendarWeek(currentDate, shifts)
  }, [currentDate, shifts])

  const navigateWeek = (direction: 'prev' | 'next') => {
    const days = direction === 'prev' ? -7 : 7
    onDateChange?.(addDays(currentDate, days))
  }

  // Get shifts for an employee on a specific day
  const getEmployeeShiftsForDay = (employeeId: string, date: string): Shift[] => {
    return shifts.filter(shift => {
      if (shift.date !== date) return false
      return shift.assignedEmployees.some(
        a => a.employeeId === employeeId && (a.status === 'ASSIGNED' || a.status === 'CONFIRMED')
      )
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => onDateChange?.(new Date())}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Today
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            {formatDateDisplay(week.startDate, 'medium')} - {formatDateDisplay(week.endDate, 'medium')}
          </h2>
        </div>
      </div>

      {/* Timeline Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b">
            <div className="w-48 px-4 py-3 font-medium text-gray-500 bg-gray-50">
              Employee
            </div>
            {week.days.map(day => (
              <div
                key={day.date}
                className={`px-2 py-3 text-center border-l ${
                  day.isToday ? 'bg-blue-50' : day.isWeekend ? 'bg-gray-50' : ''
                }`}
              >
                <div className="text-xs text-gray-500 uppercase">{getDayName(day.dayOfWeek)}</div>
                <div className={`text-lg font-semibold ${day.isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                  {new Date(day.date).getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Employee Rows */}
          <div className="max-h-[500px] overflow-y-auto">
            {employees.map(employee => (
              <div key={employee.id} className="grid grid-cols-8 border-b last:border-b-0 hover:bg-gray-50">
                {/* Employee info */}
                <div className="w-48 px-4 py-3 border-r bg-white sticky left-0 z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {employee.firstName} {employee.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{employee.role}</div>
                    </div>
                  </div>
                </div>

                {/* Day cells */}
                {week.days.map(day => {
                  const employeeShifts = getEmployeeShiftsForDay(employee.id, day.date)

                  return (
                    <div
                      key={day.date}
                      className={`min-h-[60px] p-1 border-l ${
                        day.isToday ? 'bg-blue-50/30' : day.isWeekend ? 'bg-gray-50/50' : ''
                      }`}
                    >
                      {employeeShifts.map(shift => (
                        <div
                          key={shift.id}
                          className="text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: shift.color + '30', borderLeft: `3px solid ${shift.color}` }}
                          onClick={() => onShiftClick?.(shift)}
                        >
                          <div className="font-medium truncate">{shift.title}</div>
                          <div className="text-gray-600">
                            {shift.startTime.slice(0, 5)} - {shift.endTime.slice(0, 5)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}

            {employees.length === 0 && (
              <div className="py-12 text-center text-gray-500">
                No employees to display
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
