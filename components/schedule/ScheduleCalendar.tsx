'use client'

import { useState, useEffect } from 'react'
import { CalendarMonth, CalendarDay, ScheduleEntry, SCHEDULE_STATUS_COLORS } from '@/types/schedule'

interface ScheduleCalendarProps {
  year: number
  month: number // 0-11
  userId?: string
  onDayClick?: (date: string) => void
  onEntryClick?: (entry: ScheduleEntry) => void
}

export default function ScheduleCalendar({
  year,
  month,
  userId,
  onDayClick,
  onEntryClick
}: ScheduleCalendarProps) {
  const [calendarData, setCalendarData] = useState<CalendarMonth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalendarData()
  }, [year, month, userId])

  const fetchCalendarData = async () => {
    setLoading(true)
    try {
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      let url = `/api/schedule/entries?startDate=${firstDay.toISOString().split('T')[0]}&endDate=${lastDay.toISOString().split('T')[0]}`
      if (userId) {
        url += `&userId=${userId}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const entries = await response.json()
        const calendarMonth = generateCalendarMonth(year, month, entries)
        setCalendarData(calendarMonth)
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCalendarMonth = (year: number, month: number, entries: any[]): CalendarMonth => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    // Group entries by date
    const entriesByDate: Record<string, any[]> = {}
    for (const entry of entries) {
      const dateStr = new Date(entry.date).toISOString().split('T')[0]
      if (!entriesByDate[dateStr]) {
        entriesByDate[dateStr] = []
      }
      entriesByDate[dateStr].push(entry)
    }

    // Generate weeks
    const weeks: any[] = []
    let currentDate = new Date(firstDay)
    currentDate.setDate(currentDate.getDate() - currentDate.getDay()) // Start from Sunday

    const today = new Date().toISOString().split('T')[0]

    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      const week: any = { weekNumber: weeks.length + 1, days: [] }

      for (let i = 0; i < 7; i++) {
        const dateStr = currentDate.toISOString().split('T')[0]
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

      if (currentDate.getMonth() !== month && currentDate.getDay() === 0) {
        break
      }
    }

    return { year, month, weeks }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        Loading calendar...
      </div>
    )
  }

  if (!calendarData) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-500">
        Failed to load calendar
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="divide-y">
        {calendarData.weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 divide-x">
            {week.days.map((day: CalendarDay) => (
              <div
                key={day.date}
                onClick={() => onDayClick?.(day.date)}
                className={`min-h-[100px] p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${day.isToday ? 'bg-blue-50' : ''}`}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {new Date(day.date).getDate()}
                  </span>
                  <div className="flex gap-1">
                    {day.hasOpenShifts && (
                      <span className="w-2 h-2 rounded-full bg-yellow-400" title="Open shifts" />
                    )}
                    {day.hasEmergencyShifts && (
                      <span className="w-2 h-2 rounded-full bg-red-500" title="Emergency" />
                    )}
                  </div>
                </div>

                {/* Entries */}
                <div className="space-y-1">
                  {day.entries.slice(0, 3).map((entry: any) => (
                    <div
                      key={entry.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEntryClick?.(entry)
                      }}
                      className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 ${
                        entry.isEmergency
                          ? 'bg-red-100 text-red-700'
                          : entry.isOpenShift && entry.status !== 'FILLED'
                          ? 'bg-yellow-100 text-yellow-700'
                          : SCHEDULE_STATUS_COLORS[entry.status as keyof typeof SCHEDULE_STATUS_COLORS] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {entry.startTime} - {entry.user?.firstName || 'Open'}
                    </div>
                  ))}
                  {day.entries.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{day.entries.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
