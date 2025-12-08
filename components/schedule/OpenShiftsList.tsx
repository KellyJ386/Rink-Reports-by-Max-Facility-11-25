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
  waitlistUsers?: string[]
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

interface OpenShiftsListProps {
  shifts: ScheduleEntry[]
  onClaim: (entryId: string) => void
  currentUserId?: string
}

export default function OpenShiftsList({
  shifts,
  onClaim,
  currentUserId,
}: OpenShiftsListProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const emergencyShifts = shifts.filter(s => s.isEmergency && s.status === 'PUBLISHED')
  const regularOpenShifts = shifts.filter(s => !s.isEmergency && s.status === 'PUBLISHED')

  const isUserOnWaitlist = (shift: ScheduleEntry) => {
    if (!currentUserId || !shift.waitlistUsers) return false
    return (shift.waitlistUsers as string[]).includes(currentUserId)
  }

  const getWaitlistPosition = (shift: ScheduleEntry) => {
    if (!currentUserId || !shift.waitlistUsers) return -1
    return (shift.waitlistUsers as string[]).indexOf(currentUserId) + 1
  }

  if (shifts.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Emergency Shifts */}
      {emergencyShifts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
            🚨 Emergency Coverage Needed
          </h3>
          <div className="grid gap-3">
            {emergencyShifts.map((shift) => {
              const onWaitlist = isUserOnWaitlist(shift)
              const position = getWaitlistPosition(shift)

              return (
                <div
                  key={shift.id}
                  className="bg-white border border-red-200 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-red-800">
                      {formatDate(shift.date)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                    {shift.waitlistUsers && (shift.waitlistUsers as string[]).length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {(shift.waitlistUsers as string[]).length} on waitlist
                      </div>
                    )}
                  </div>
                  <div>
                    {onWaitlist ? (
                      <span className="text-sm text-gray-600 px-3 py-1 bg-gray-100 rounded">
                        Position #{position}
                      </span>
                    ) : (
                      <button
                        onClick={() => onClaim(shift.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm font-medium"
                      >
                        Claim Shift
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Regular Open Shifts */}
      {regularOpenShifts.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
            📋 Open Shifts Available
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {regularOpenShifts.map((shift) => {
              const onWaitlist = isUserOnWaitlist(shift)
              const position = getWaitlistPosition(shift)

              return (
                <div
                  key={shift.id}
                  className="bg-white border border-yellow-200 rounded-lg p-3"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">{formatDate(shift.date)}</div>
                      <div className="text-sm text-gray-600">
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                    </div>
                  </div>
                  {shift.waitlistUsers && (shift.waitlistUsers as string[]).length > 0 && (
                    <div className="text-xs text-gray-500 mb-2">
                      {(shift.waitlistUsers as string[]).length} on waitlist
                    </div>
                  )}
                  {onWaitlist ? (
                    <div className="text-sm text-gray-600 text-center py-1 bg-gray-100 rounded">
                      On waitlist (#{position})
                    </div>
                  ) : (
                    <button
                      onClick={() => onClaim(shift.id)}
                      className="w-full bg-yellow-600 text-white px-3 py-1.5 rounded hover:bg-yellow-700 text-sm font-medium"
                    >
                      Claim Shift
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
