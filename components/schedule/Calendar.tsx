'use client'

import { useState, useMemo } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns'

interface ScheduleEntry {
  id: string
  date: Date | string
  startTime: string
  endTime: string
  userId: string
  user?: {
    firstName: string
    lastName: string
  }
  status: string
  isOpenShift: boolean
  isEmergency: boolean
  shiftId?: string
  rinkId?: string
}

interface CalendarProps {
  entries: ScheduleEntry[]
  view: 'week' | 'month'
  onViewChange: (view: 'week' | 'month') => void
  onDateSelect?: (date: Date) => void
  onEntryClick?: (entry: ScheduleEntry) => void
  selectedDate?: Date
}

export default function Calendar({
  entries,
  view,
  onViewChange,
  onDateSelect,
  onEntryClick,
  selectedDate = new Date(),
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate)

  const days = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 })
      const end = endOfWeek(currentDate, { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    } else {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
      return eachDayOfInterval({ start, end })
    }
  }, [currentDate, view])

  const navigate = (direction: 'prev' | 'next') => {
    if (view === 'week') {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1))
    } else {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1))
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEntriesForDay = (day: Date) => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date)
      return isSameDay(entryDate, day)
    })
  }

  const getStatusColor = (status: string, isOpen: boolean, isEmergency: boolean) => {
    if (isEmergency) return 'bg-red-500 text-white'
    if (isOpen) return 'bg-yellow-400 text-yellow-900'
    switch (status) {
      case 'PUBLISHED':
        return 'bg-blue-500 text-white'
      case 'FILLED':
        return 'bg-green-500 text-white'
      case 'CANCELLED':
        return 'bg-gray-400 text-white line-through'
      default:
        return 'bg-gray-200 text-gray-700'
    }
  }

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {view === 'week'
              ? `Week of ${format(days[0], 'MMM d, yyyy')}`
              : format(currentDate, 'MMMM yyyy')
            }
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => onViewChange('week')}
              className={`px-3 py-1 text-sm ${
                view === 'week' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => onViewChange('month')}
              className={`px-3 py-1 text-sm ${
                view === 'month' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'
              }`}
            >
              Month
            </button>
          </div>

          {/* Navigation */}
          <button
            onClick={() => navigate('prev')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            ←
          </button>
          <button
            onClick={() => navigate('next')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {/* Day Headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 border-b bg-gray-50"
          >
            {day}
          </div>
        ))}

        {/* Day Cells */}
        {days.map((day) => {
          const dayEntries = getEntriesForDay(day)
          const isToday = isSameDay(day, new Date())
          const isCurrentMonth = isSameMonth(day, currentDate)

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDateSelect?.(day)}
              className={`min-h-[100px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 ${
                !isCurrentMonth && view === 'month' ? 'bg-gray-50 text-gray-400' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium ${
                    isToday
                      ? 'w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded-full'
                      : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>
                {dayEntries.length > 3 && view === 'month' && (
                  <span className="text-xs text-gray-400">+{dayEntries.length - 3}</span>
                )}
              </div>

              <div className="space-y-1">
                {dayEntries.slice(0, view === 'month' ? 3 : undefined).map((entry) => (
                  <div
                    key={entry.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEntryClick?.(entry)
                    }}
                    className={`px-2 py-1 text-xs rounded truncate ${getStatusColor(
                      entry.status,
                      entry.isOpenShift,
                      entry.isEmergency
                    )}`}
                    title={`${entry.startTime}-${entry.endTime}: ${entry.user?.firstName || 'Open'}`}
                  >
                    {entry.startTime} - {entry.user?.firstName || 'OPEN'}
                    {entry.isEmergency && ' 🚨'}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 border-t text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded" />
          <span>Draft</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span>Published</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span>Filled</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-yellow-400 rounded" />
          <span>Open Shift</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span>Emergency</span>
        </div>
      </div>
    </div>
  )
}
