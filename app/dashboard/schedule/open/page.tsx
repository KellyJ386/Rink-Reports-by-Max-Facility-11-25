import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function formatTime(time: string) {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export default async function OpenShiftsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'schedule', 'access')) {
    redirect('/dashboard')
  }

  // Get open shifts
  const openShifts = await prisma.scheduleEntry.findMany({
    where: {
      user: { facilityId: user.facilityId },
      isOpenShift: true,
      status: { not: 'FILLED' },
      date: { gte: new Date() },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  // Separate emergency and regular open shifts
  const emergencyShifts = openShifts.filter((s) => s.isEmergency)
  const regularShifts = openShifts.filter((s) => !s.isEmergency)

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/schedule" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Open Shifts</h1>
          <p className="text-gray-600 text-sm mt-1">Available shifts needing coverage</p>
        </div>
      </div>

      {openShifts.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All Shifts Covered!</h2>
          <p className="text-gray-500">No open shifts at this time</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Emergency Shifts */}
          {emergencyShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🚨</span>
                Emergency Coverage Needed
              </h2>
              <div className="space-y-3">
                {emergencyShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="card border-l-4 border-red-500 bg-red-50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-red-900">
                          {new Date(shift.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-red-700">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                          Urgent
                        </span>
                        <button className="btn btn-primary bg-red-600 hover:bg-red-700">
                          Pick Up Shift
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Open Shifts */}
          {regularShifts.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Available Shifts</h2>
              <div className="space-y-3">
                {regularShifts.map((shift) => (
                  <div key={shift.id} className="card border-l-4 border-orange-400">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {new Date(shift.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </div>
                        <div className="text-gray-600">
                          {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                        </div>
                      </div>
                      <button className="btn btn-primary">
                        Pick Up Shift
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
