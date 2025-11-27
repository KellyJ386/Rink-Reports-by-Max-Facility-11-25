import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function getWeekDates(date: Date): Date[] {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  const dates: Date[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    dates.push(d)
  }
  return dates
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export default async function SchedulePage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'schedule', 'access')) {
    redirect('/dashboard')
  }

  const canPublish = canUserAccess(user, 'schedule', 'publish')
  const canCreate = canUserAccess(user, 'schedule', 'create')

  // Get current week dates
  const today = new Date()
  const weekDates = getWeekDates(today)
  const weekStart = weekDates[0]
  const weekEnd = weekDates[6]

  // Get shift definitions for the facility
  const shifts = await prisma.shiftDefinition.findMany({
    where: {
      facilityId: user.facilityId,
      isActive: true,
    },
    orderBy: { startTime: 'asc' },
  })

  // Get schedule entries for the week
  const scheduleEntries = await prisma.scheduleEntry.findMany({
    where: {
      user: { facilityId: user.facilityId },
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  // Get open shifts
  const openShifts = scheduleEntries.filter((e) => e.isOpenShift && e.status !== 'FILLED')

  // Get users for assignment
  const users = await prisma.user.findMany({
    where: {
      facilityId: user.facilityId,
      isActive: true,
    },
    select: { id: true, firstName: true, lastName: true, role: { select: { name: true } } },
    orderBy: { lastName: 'asc' },
  })

  // Group entries by date
  const entriesByDate: Record<string, typeof scheduleEntries> = {}
  weekDates.forEach((d) => {
    const key = d.toISOString().split('T')[0]
    entriesByDate[key] = scheduleEntries.filter(
      (e) => new Date(e.date).toISOString().split('T')[0] === key
    )
  })

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600 text-sm mt-1">
            Week of {weekStart.toLocaleDateString()} - {weekEnd.toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {canCreate && (
            <Link href="/dashboard/schedule/new" className="btn btn-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Shift
            </Link>
          )}
        </div>
      </div>

      {/* Open Shifts Alert */}
      {openShifts.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6 rounded-r-lg">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📢</span>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-800">Open Shifts Available</h3>
              <p className="text-orange-700 text-sm">
                {openShifts.length} shift{openShifts.length > 1 ? 's' : ''} need coverage
              </p>
            </div>
            <Link href="/dashboard/schedule/open" className="btn btn-secondary text-sm">
              View Open Shifts
            </Link>
          </div>
        </div>
      )}

      {/* Week View Calendar */}
      <div className="card mb-6 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {weekDates.map((date, idx) => {
              const dateKey = date.toISOString().split('T')[0]
              const entries = entriesByDate[dateKey] || []
              const isToday = date.toDateString() === today.toDateString()

              return (
                <div key={idx} className="bg-white">
                  <div className={`p-3 text-center border-b ${isToday ? 'bg-blue-50' : ''}`}>
                    <div className="text-sm text-gray-500">{dayNames[idx]}</div>
                    <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="p-2 min-h-[200px] space-y-2">
                    {entries.length === 0 ? (
                      <div className="text-center text-gray-400 text-sm py-4">No shifts</div>
                    ) : (
                      entries.map((entry) => (
                        <div
                          key={entry.id}
                          className={`p-2 rounded text-sm ${
                            entry.isOpenShift
                              ? 'bg-orange-100 border border-orange-300'
                              : entry.isEmergency
                              ? 'bg-red-100 border border-red-300'
                              : 'bg-blue-100 border border-blue-200'
                          }`}
                        >
                          <div className="font-medium truncate">
                            {entry.isOpenShift ? 'OPEN SHIFT' : `${entry.user.firstName} ${entry.user.lastName.charAt(0)}.`}
                          </div>
                          <div className="text-xs text-gray-600">
                            {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                          </div>
                          {entry.isEmergency && (
                            <span className="text-xs text-red-600 font-medium">Emergency</span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Shift Definitions */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shift Definitions</h2>
          {shifts.length === 0 ? (
            <p className="text-gray-400 text-sm">No shifts defined yet</p>
          ) : (
            <div className="space-y-2">
              {shifts.map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{shift.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                  </div>
                  {shift.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: shift.color }}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Staff</h2>
          {users.length === 0 ? (
            <p className="text-gray-400 text-sm">No staff members</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{u.firstName} {u.lastName}</div>
                    <div className="text-xs text-gray-500">{u.role.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* My Schedule */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Upcoming Shifts</h2>
        {(() => {
          const myShifts = scheduleEntries.filter(
            (e) => e.userId === user.id && new Date(e.date) >= today
          )
          if (myShifts.length === 0) {
            return <p className="text-gray-400 text-sm">No upcoming shifts scheduled</p>
          }
          return (
            <div className="space-y-2">
              {myShifts.slice(0, 5).map((shift) => (
                <div key={shift.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(shift.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    shift.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {shift.status === 'PUBLISHED' ? 'Confirmed' : shift.status}
                  </span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
