'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Shift, ShiftTemplate, CalendarMonth, CalendarDay } from '@/types/schedule'
import { generateCalendarMonth, formatDate } from '@/lib/schedule-utils'
import { ShiftIndicator } from './ShiftCard'

interface CalendarMonthViewProps {
  currentDate: Date
  shifts: Shift[]
  templates?: ShiftTemplate[]
  onDateChange: (date: Date) => void
  onShiftClick?: (shift: Shift) => void
  onDayClick?: (date: string) => void
  onCreateShift?: (date: string) => void
  showWeekNumbers?: boolean
  maxShiftsPerDay?: number
  highlightToday?: boolean
  className?: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export function CalendarMonthView({
  currentDate,
  shifts,
  templates = [],
  onDateChange,
  onShiftClick,
  onDayClick,
  onCreateShift,
  showWeekNumbers = false,
  maxShiftsPerDay = 3,
  highlightToday = true,
  className,
}: CalendarMonthViewProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const calendarMonth = useMemo(() => {
    return generateCalendarMonth(year, month, shifts)
  }, [year, month, shifts])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    onDateChange(newDate)
  }

  const goToToday = () => {
    onDateChange(new Date())
  }

  const getShiftStats = (day: CalendarDay) => {
    const filled = day.shifts.filter(s => s.status === 'FILLED').length
    const open = day.shifts.filter(s => s.isOpen || s.status === 'OPEN').length
    const total = day.shifts.length
    return { filled, open, total }
  }

  return (
    <Card className={cn('p-4', className)}>
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('prev')}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold min-w-[180px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth('next')}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className={cn(
          'grid bg-muted/50',
          showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'
        )}>
          {showWeekNumbers && (
            <div className="p-2 text-center text-xs font-medium text-muted-foreground border-b border-r">
              Wk
            </div>
          )}
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-xs font-medium text-muted-foreground border-b last:border-r-0 border-r"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar weeks */}
        {calendarMonth.weeks.map((week) => (
          <div
            key={week.weekNumber}
            className={cn(
              'grid',
              showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'
            )}
          >
            {showWeekNumbers && (
              <div className="p-2 text-center text-xs text-muted-foreground bg-muted/30 border-r border-b flex items-center justify-center">
                {week.weekNumber}
              </div>
            )}

            {week.days.map((day) => {
              const stats = getShiftStats(day)
              const isHovered = hoveredDay === day.date
              const visibleShifts = day.shifts.slice(0, maxShiftsPerDay)
              const hiddenCount = day.shifts.length - maxShiftsPerDay

              return (
                <div
                  key={day.date}
                  className={cn(
                    'min-h-[100px] p-1 border-r border-b last:border-r-0 transition-colors',
                    !day.isCurrentMonth && 'bg-muted/30',
                    day.isWeekend && day.isCurrentMonth && 'bg-muted/10',
                    day.isToday && highlightToday && 'bg-blue-50 dark:bg-blue-950/30',
                    isHovered && 'bg-muted/50'
                  )}
                  onMouseEnter={() => setHoveredDay(day.date)}
                  onMouseLeave={() => setHoveredDay(null)}
                  onClick={() => onDayClick?.(day.date)}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full',
                        !day.isCurrentMonth && 'text-muted-foreground',
                        day.isToday && highlightToday && 'bg-blue-600 text-white'
                      )}
                    >
                      {parseInt(day.date.split('-')[2])}
                    </span>

                    {isHovered && onCreateShift && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateShift(day.date)
                        }}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Shift indicators */}
                  <div className="space-y-0.5">
                    {visibleShifts.map((shift) => (
                      <ShiftIndicator
                        key={shift.id}
                        shift={shift}
                        onClick={() => onShiftClick?.(shift)}
                      />
                    ))}

                    {hiddenCount > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3 w-3" />
                            {hiddenCount} more
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-2" align="start">
                          <div className="space-y-1">
                            <p className="text-sm font-medium mb-2">
                              All shifts for {formatDate(new Date(day.date))}
                            </p>
                            {day.shifts.map((shift) => (
                              <ShiftIndicator
                                key={shift.id}
                                shift={shift}
                                onClick={() => onShiftClick?.(shift)}
                              />
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {/* Stats badges */}
                  {stats.total > 0 && (
                    <div className="flex gap-1 mt-1">
                      {stats.open > 0 && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 bg-yellow-50 text-yellow-700 border-yellow-200">
                          {stats.open} open
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Filled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500" />
          <span>Open</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-300" />
          <span>Draft</span>
        </div>
      </div>
    </Card>
  )
}

// Mini calendar for date picking
interface MiniCalendarProps {
  selectedDate: Date
  onSelectDate: (date: Date) => void
  highlightedDates?: string[]
  className?: string
}

export function MiniCalendar({
  selectedDate,
  onSelectDate,
  highlightedDates = [],
  className,
}: MiniCalendarProps) {
  const [viewDate, setViewDate] = useState(selectedDate)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth() + 1

  const calendarMonth = useMemo(() => {
    return generateCalendarMonth(year, month, [])
  }, [year, month])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setViewDate(newDate)
  }

  const selectedDateStr = formatDate(selectedDate)

  return (
    <div className={cn('w-64', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigateMonth('prev')}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => navigateMonth('next')}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div
            key={i}
            className="text-center text-xs text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      {calendarMonth.weeks.map((week) => (
        <div key={week.weekNumber} className="grid grid-cols-7">
          {week.days.map((day) => {
            const isSelected = day.date === selectedDateStr
            const isHighlighted = highlightedDates.includes(day.date)

            return (
              <button
                key={day.date}
                className={cn(
                  'h-7 w-7 mx-auto flex items-center justify-center text-sm rounded-full transition-colors',
                  !day.isCurrentMonth && 'text-muted-foreground/50',
                  day.isToday && !isSelected && 'border border-primary',
                  isSelected && 'bg-primary text-primary-foreground',
                  isHighlighted && !isSelected && 'bg-primary/10',
                  !isSelected && 'hover:bg-muted'
                )}
                onClick={() => onSelectDate(new Date(day.date))}
              >
                {parseInt(day.date.split('-')[2])}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Year view calendar
interface CalendarYearViewProps {
  year: number
  onYearChange: (year: number) => void
  onMonthClick: (month: number) => void
  shiftCountsByMonth?: Record<number, number>
  className?: string
}

export function CalendarYearView({
  year,
  onYearChange,
  onMonthClick,
  shiftCountsByMonth = {},
  className,
}: CalendarYearViewProps) {
  return (
    <Card className={cn('p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onYearChange(year - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">{year}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onYearChange(year + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Months grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
        {MONTH_NAMES.map((monthName, index) => {
          const monthNum = index + 1
          const shiftCount = shiftCountsByMonth[monthNum] || 0
          const isCurrentMonth =
            new Date().getFullYear() === year &&
            new Date().getMonth() === index

          return (
            <button
              key={monthName}
              className={cn(
                'p-4 rounded-lg border text-left transition-colors hover:bg-muted',
                isCurrentMonth && 'border-primary bg-primary/5'
              )}
              onClick={() => onMonthClick(monthNum)}
            >
              <p className="font-medium">{monthName}</p>
              {shiftCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {shiftCount} shift{shiftCount !== 1 ? 's' : ''}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
