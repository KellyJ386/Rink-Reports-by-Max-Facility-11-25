'use client'

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
}

export default function ScheduleCalendar({
  entries,
  currentDate,
  viewMode,
  onEntryClick,
  canViewAll,
  currentUserId,
}: ScheduleCalendarProps) {
  const getDaysInView = () => {
    const days: Date[] = []
    const startDate = new Date(currentDate)

    if (viewMode === 'week') {
      // Start from Sunday of the current week
      startDate.setDate(startDate.getDate() - startDate.getDay())
      for (let i = 0; i < 7; i++) {
        const day = new Date(startDate)
        day.setDate(startDate.getDate() + i)
        days.push(day)
      }
    } else {
      // Start from first day of month
      startDate.setDate(1)
      const month = startDate.getMonth()

      // Go back to Sunday of first week
      startDate.setDate(startDate.getDate() - startDate.getDay())

      // Get 6 weeks (42 days)
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
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="card overflow-hidden">
      {/* Day Headers */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {dayNames.map((day) => (
          <div
            key={day}
            className="py-2 px-1 text-center text-sm font-semibold text-gray-600"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div
        className={`grid grid-cols-7 ${
          viewMode === 'month' ? 'auto-rows-[120px]' : 'auto-rows-[200px]'
        }`}
      >
        {days.map((day, index) => {
          const dateStr = day.toISOString().split('T')[0]
          const dayEntries = getEntriesForDay(day)
          const isToday = dateStr === today
          const isCurrentMonth = day.getMonth() === currentDate.getMonth()

          return (
            <div
              key={index}
              className={`border-b border-r p-1 ${
                !isCurrentMonth && viewMode === 'month'
                  ? 'bg-gray-50'
                  : 'bg-white'
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              {/* Date Number */}
              <div
                className={`text-sm mb-1 ${
                  isToday
                    ? 'w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center'
                    : ''
                } ${!isCurrentMonth && viewMode === 'month' ? 'text-gray-400' : ''}`}
              >
                {day.getDate()}
              </div>

              {/* Entries */}
              <div className="space-y-1 overflow-y-auto max-h-[calc(100%-24px)]">
                {dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => onEntryClick?.(entry)}
                    className={`text-xs p-1 rounded border ${getStatusColor(entry)} ${
                      onEntryClick ? 'cursor-pointer hover:opacity-80' : ''
                    } truncate`}
                    title={`${entry.user.firstName} ${entry.user.lastName}: ${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`}
                  >
                    {entry.isOpenShift ? (
                      <span className="font-semibold">
                        {entry.isEmergency ? '🚨 ' : '📋 '}
                        OPEN
                      </span>
                    ) : (
                      <span>{entry.user.firstName} {entry.user.lastName.charAt(0)}.</span>
                    )}
                    <span className="block text-[10px]">
                      {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                    </span>
                    {entry.status === 'DRAFT' && (
                      <span className="text-[10px] italic"> (Draft)</span>
                    )}
                  </div>
                ))}

                {dayEntries.length === 0 && viewMode === 'week' && (
                  <div className="text-xs text-gray-400 italic">No shifts</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="p-3 bg-gray-50 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-300"></div>
            <span>Draft</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
            <span>Published</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
            <span>Filled</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
            <span>Open Shift</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
            <span>Emergency</span>
          </div>
        </div>
      </div>
    </div>
  )
}
