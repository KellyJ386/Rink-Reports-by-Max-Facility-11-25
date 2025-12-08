'use client'

import { useState, useEffect } from 'react'

interface ScheduleEntry {
  id: string
  userId: string
  date: string
  startTime: string
  endTime: string
  isOpenShift: boolean
  isEmergency: boolean
  status: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface ScheduleCalendarProps {
  entries: ScheduleEntry[]
  currentDate: Date
  viewMode: 'week' | 'month'
  onEntryClick?: (entry: ScheduleEntry) => void
  canViewAll: boolean
  currentUserId?: string
  loading?: boolean
}

export default function ScheduleCalendar({
  entries,
  currentDate,
  viewMode,
  onEntryClick,
  canViewAll,
  currentUserId,
  loading = false,
}: ScheduleCalendarProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getDaysInView = () => {
    const days: Date[] = []
    const startDate = new Date(currentDate)

    if (viewMode === 'week') {
      startDate.setDate(startDate.getDate() - startDate.getDay())
      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate)
        day.setDate(startDate.getDate() + i)
        days.push(day)
      }
    } else {
      startDate.setDate(1)
      const month = startDate.getMonth()
      startDate.setDate(startDate.getDate() - startDate.getDay())
      for (let i = 0; i < 42; i++) {
        const day = new Date(startDate)
        day.setDate(startDate.getDate() + i)
        days.push(day)
      }
    }

    return days
  }

  const getEntriesForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return entries.filter((entry) => {
      const entryDate = new Date(entry.date).toISOString().split('T')[0]
      return entryDate === dateStr
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatTimeShort = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'p' : 'a'
    const displayHour = hour % 12 || 12
    return `${displayHour}${ampm}`
  }

  const getStatusColor = (entry: ScheduleEntry) => {
    if (entry.isEmergency) return 'bg-red-100 border-red-300 text-red-800'
    if (entry.isOpenShift) return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    if (entry.status === 'DRAFT') return 'bg-gray-100 border-gray-300 text-gray-700'
    if (entry.status === 'PUBLISHED') return 'bg-blue-100 border-blue-300 text-blue-800'
    if (entry.status === 'FILLED') return 'bg-green-100 border-green-300 text-green-800'
    if (entry.status === 'CANCELLED') return 'bg-gray-100 border-gray-300 text-gray-400 line-through'
    return 'bg-gray-100 border-gray-300'
  }

  const days = getDaysInView()
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayNamesFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = new Date().toISOString().split('T')[0]

  // Loading skeleton
  if (loading) {
    return (
      <div className="card overflow-hidden animate-pulse" role="status" aria-label="Loading schedule">
        <div className="grid grid-cols-7 bg-gray-50 border-b">
          {dayNames.map((day) => (
            <div key={day} className="py-2 px-1 text-center">
              <div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[100px]">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="border-b border-r p-2">
              <div className="h-4 bg-gray-200 rounded w-6 mb-2"></div>
              <div className="h-10 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
        <span className="sr-only">Loading schedule...</span>
      </div>
    )
  }

  // Mobile list view
  if (isMobile && viewMode === 'week') {
    return (
      <div className="card overflow-hidden" role="region" aria-label="Weekly schedule">
        {/* Mobile day selector */}
        <div className="flex overflow-x-auto border-b snap-x snap-mandatory" role="tablist">
          {days.map((day) => {
            const dateStr = day.toISOString().split('T')[0]
            const dayEntries = getEntriesForDay(day)
            const isToday = dateStr === today
            const isSelected = selectedDay?.toISOString().split('T')[0] === dateStr

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(day)}
                role="tab"
                aria-selected={isSelected}
                aria-label={`${dayNamesFull[day.getDay()]}, ${day.toLocaleDateString()}`}
                className={`flex-shrink-0 px-4 py-3 text-center snap-center transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : isToday
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="text-xs font-medium">{dayNames[day.getDay()]}</div>
                <div className={`text-lg font-bold ${isSelected ? '' : isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                {dayEntries.length > 0 && !isSelected && (
                  <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto mt-1"></div>
                )}
              </button>
            )
          })}
        </div>

        {/* Selected day entries */}
        <div className="p-4" role="tabpanel" aria-label={selectedDay ? `Shifts for ${dayNamesFull[selectedDay.getDay()]}` : 'Select a day'}>
          {selectedDay ? (
            <>
              <h3 className="font-semibold mb-3">
                {dayNamesFull[selectedDay.getDay()]},{' '}
                {selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </h3>
              {getEntriesForDay(selectedDay).length === 0 ? (
                <p className="text-gray-500 text-center py-6">No shifts scheduled</p>
              ) : (
                <ul className="space-y-2" role="list">
                  {getEntriesForDay(selectedDay).map((entry) => (
                    <li key={entry.id}>
                      <button
                        onClick={() => onEntryClick?.(entry)}
                        disabled={!onEntryClick}
                        aria-label={`${entry.isOpenShift ? 'Open shift' : `${entry.user.firstName} ${entry.user.lastName}`}, ${formatTime(entry.startTime)} to ${formatTime(entry.endTime)}, ${entry.status}`}
                        className={`w-full text-left p-3 rounded-lg border ${getStatusColor(entry)} ${
                          onEntryClick ? 'active:scale-[0.98] transition-transform' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {entry.isOpenShift ? (
                                <>
                                  {entry.isEmergency && <span aria-label="Emergency">🚨 </span>}
                                  Open Shift
                                </>
                              ) : (
                                `${entry.user.firstName} ${entry.user.lastName}`
                              )}
                            </div>
                            <div className="text-sm opacity-75">
                              {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                            {entry.status}
                          </span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-6">Select a day to view shifts</p>
          )}
        </div>
      </div>
    )
  }

  // Desktop/tablet grid view
  return (
    <div className="card overflow-hidden" role="region" aria-label={`${viewMode === 'week' ? 'Weekly' : 'Monthly'} schedule calendar`}>
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b" role="row">
        {dayNames.map((day, i) => (
          <div
            key={day}
            role="columnheader"
            aria-label={dayNamesFull[i]}
            className="py-2 md:py-3 px-1 text-center text-xs md:text-sm font-semibold text-gray-600"
          >
            <span className="hidden sm:inline">{dayNamesFull[i]}</span>
            <span className="sm:hidden">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        className={`grid grid-cols-7 ${
          viewMode === 'month' ? 'auto-rows-[80px] md:auto-rows-[120px]' : 'auto-rows-[120px] md:auto-rows-[200px]'
        }`}
        role="grid"
      >
        {days.map((day, index) => {
          const dateStr = day.toISOString().split('T')[0]
          const dayEntries = getEntriesForDay(day)
          const isToday = dateStr === today
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()

          return (
            <div
              key={index}
              role="gridcell"
              aria-label={`${dayNamesFull[day.getDay()]}, ${day.toLocaleDateString()}, ${dayEntries.length} shifts`}
              className={`border-b border-r p-1 md:p-2 ${
                !isCurrentMonth && viewMode === 'month'
                  ? 'bg-gray-50'
                  : 'bg-white'
              } ${isToday ? 'bg-blue-50' : ''} transition-colors`}
            >
              {/* Date Number */}
              <div
                className={`text-xs md:text-sm mb-1 ${
                  isToday
                    ? 'w-5 h-5 md:w-6 md:h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold'
                    : ''
                } ${!isCurrentMonth && viewMode === 'month' ? 'text-gray-400' : ''}`}
              >
                {day.getDate()}
              </div>

              {/* Entries */}
              <div className="space-y-0.5 md:space-y-1 overflow-y-auto max-h-[calc(100%-20px)] md:max-h-[calc(100%-24px)]" role="list">
                {dayEntries.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => onEntryClick?.(entry)}
                    disabled={!onEntryClick}
                    aria-label={`${entry.isOpenShift ? 'Open shift' : `${entry.user.firstName} ${entry.user.lastName}`}, ${formatTime(entry.startTime)} to ${formatTime(entry.endTime)}`}
                    className={`w-full text-left text-[10px] md:text-xs p-0.5 md:p-1 rounded border ${getStatusColor(entry)} ${
                      onEntryClick ? 'cursor-pointer hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
                    } truncate transition-opacity`}
                  >
                    {entry.isOpenShift ? (
                      <span className="font-semibold">
                        {entry.isEmergency ? '🚨' : '📋'}
                        <span className="hidden md:inline"> OPEN</span>
                      </span>
                    ) : (
                      <span>
                        <span className="md:hidden">{entry.user.firstName.charAt(0)}{entry.user.lastName.charAt(0)}</span>
                        <span className="hidden md:inline">{entry.user.firstName} {entry.user.lastName.charAt(0)}.</span>
                      </span>
                    )}
                    <span className="block text-[8px] md:text-[10px]">
                      <span className="md:hidden">{formatTimeShort(entry.startTime)}-{formatTimeShort(entry.endTime)}</span>
                      <span className="hidden md:inline">{formatTime(entry.startTime)} - {formatTime(entry.endTime)}</span>
                    </span>
                  </button>
                ))}

                {dayEntries.length === 0 && viewMode === 'week' && (
                  <div className="text-[10px] md:text-xs text-gray-400 italic hidden md:block">No shifts</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend - hidden on mobile, visible on tablets+ */}
      <div className="p-2 md:p-3 bg-gray-50 border-t hidden sm:block" role="complementary" aria-label="Schedule legend">
        <div className="flex flex-wrap gap-2 md:gap-4 text-[10px] md:text-xs">
          <div className="flex items-center gap-1" role="listitem">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300" aria-hidden="true"></div>
            <span>Draft</span>
          </div>
          <div className="flex items-center gap-1" role="listitem">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" aria-hidden="true"></div>
            <span>Published</span>
          </div>
          <div className="flex items-center gap-1" role="listitem">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300" aria-hidden="true"></div>
            <span>Filled</span>
          </div>
          <div className="flex items-center gap-1" role="listitem">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" aria-hidden="true"></div>
            <span>Open</span>
          </div>
          <div className="flex items-center gap-1" role="listitem">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300" aria-hidden="true"></div>
            <span>Emergency</span>
          </div>
        </div>
      </div>
    </div>
  )
}
