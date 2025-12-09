'use client'

import * as React from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isAfter,
  isBefore,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export interface CalendarProps {
  selected?: Date | null
  onSelect?: (date: Date | null) => void
  mode?: 'single' | 'range'
  rangeStart?: Date | null
  rangeEnd?: Date | null
  onRangeChange?: (start: Date | null, end: Date | null) => void
  disabled?: (date: Date) => boolean
  className?: string
  minDate?: Date
  maxDate?: Date
}

export function Calendar({
  selected,
  onSelect,
  mode = 'single',
  rangeStart,
  rangeEnd,
  onRangeChange,
  disabled,
  className,
  minDate,
  maxDate,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    selected || rangeStart || new Date()
  )
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null)

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const weeks: Date[][] = []
  let days: Date[] = []
  let day = startDate

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day)
      day = addDays(day, 1)
    }
    weeks.push(days)
    days = []
  }

  const isDateDisabled = (date: Date) => {
    if (disabled && disabled(date)) return true
    if (minDate && isBefore(date, minDate)) return true
    if (maxDate && isAfter(date, maxDate)) return true
    return false
  }

  const handleDateClick = (date: Date) => {
    if (isDateDisabled(date)) return

    if (mode === 'single') {
      onSelect?.(date)
    } else if (mode === 'range') {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        onRangeChange?.(date, null)
      } else {
        if (isBefore(date, rangeStart)) {
          onRangeChange?.(date, rangeStart)
        } else {
          onRangeChange?.(rangeStart, date)
        }
      }
    }
  }

  const isInRange = (date: Date) => {
    if (mode !== 'range') return false
    if (rangeStart && rangeEnd) {
      return isWithinInterval(date, { start: rangeStart, end: rangeEnd })
    }
    if (rangeStart && hoverDate) {
      const start = isBefore(hoverDate, rangeStart) ? hoverDate : rangeStart
      const end = isAfter(hoverDate, rangeStart) ? hoverDate : rangeStart
      return isWithinInterval(date, { start, end })
    }
    return false
  }

  const isRangeStart = (date: Date) => {
    if (mode !== 'range' || !rangeStart) return false
    return isSameDay(date, rangeStart)
  }

  const isRangeEnd = (date: Date) => {
    if (mode !== 'range' || !rangeEnd) return false
    return isSameDay(date, rangeEnd)
  }

  return (
    <div className={cn('p-3 bg-white rounded-lg border', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={nextMonth}
          className="h-7 w-7 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayName) => (
          <div
            key={dayName}
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) =>
          week.map((date, dayIndex) => {
            const isSelected =
              mode === 'single' && selected && isSameDay(date, selected)
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isDisabled = isDateDisabled(date)
            const isToday = isSameDay(date, new Date())
            const inRange = isInRange(date)
            const isStart = isRangeStart(date)
            const isEnd = isRangeEnd(date)

            return (
              <button
                key={`${weekIndex}-${dayIndex}`}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
                disabled={isDisabled}
                className={cn(
                  'h-8 w-8 rounded-md text-sm transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  !isCurrentMonth && 'text-gray-300',
                  isCurrentMonth && !isSelected && !isDisabled && 'text-gray-900 hover:bg-gray-100',
                  isToday && !isSelected && !isStart && !isEnd && 'bg-gray-100 font-semibold',
                  isSelected && 'bg-blue-600 text-white hover:bg-blue-700',
                  isDisabled && 'opacity-50 cursor-not-allowed',
                  inRange && !isStart && !isEnd && 'bg-blue-100',
                  isStart && 'bg-blue-600 text-white rounded-r-none',
                  isEnd && 'bg-blue-600 text-white rounded-l-none',
                  isStart && isEnd && 'rounded-md'
                )}
              >
                {format(date, 'd')}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
