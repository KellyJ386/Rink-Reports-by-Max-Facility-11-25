import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { ScheduleCalendar } from '@/components/schedule'
import { format, startOfWeek, endOfWeek, addWeeks } from 'date-fns'
import Link from 'next/link'

export default async function SchedulePage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'schedule', 'access')) {
    redirect('/dashboard')
  }

  const canEdit = canUserAccess(user, 'schedule', 'create') || canUserAccess(user, 'schedule', 'edit')
  const canPublish = canUserAccess(user, 'schedule', 'publish')
  const canViewAll = canUserAccess(user, 'schedule', 'viewAll')

  // Get current week range plus some buffer
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(addWeeks(today, 4), { weekStartsOn: 0 })

  // Fetch schedule entries
  const entries = await prisma.scheduleEntry.findMany({
    where: {
      facilityId: user.facilityId,
      date: {
        gte: weekStart,
        lte: weekEnd,
      },
      ...(canViewAll ? {} : {
        OR: [
          { userId: user.id },
          { status: 'PUBLISHED' },
          { isOpenShift: true },
        ],
      }),
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: { select: { id: true, name: true } },
        },
      },
      shift: true,
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  })

  // Fetch shift definitions
  const shifts = await prisma.shiftDefinition.findMany({
    where: {
      facilityId: user.facilityId,
      isActive: true,
    },
    orderBy: [{ startTime: 'asc' }, { name: 'asc' }],
  })

  // Fetch employees
  const employees = await prisma.user.findMany({
    where: {
      facilityId: user.facilityId,
      isActive: true,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      isActive: true,
      role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
  })

  // Calculate some stats
  const pendingTimeOff = await prisma.timeOffRequest.count({
    where: {
      facilityId: user.facilityId,
      status: 'PENDING',
    },
  })

  const pendingSwaps = await prisma.shiftSwapRequest.count({
    where: {
      facilityId: user.facilityId,
      status: { in: ['PENDING_PEER', 'PENDING_MANAGER'] },
    },
  })

  const openShifts = entries.filter(e => e.isOpenShift || !e.userId).length

  return (
    <div className="h-full flex flex-col">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employee Schedule</h1>
            <p className="text-gray-600 mt-1">
              Manage staff schedules, shifts, and coverage
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Stats */}
            {openShifts > 0 && (
              <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm">
                {openShifts} open shifts
              </span>
            )}
            {pendingTimeOff > 0 && canViewAll && (
              <Link
                href="/dashboard/schedule/time-off"
                className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm hover:bg-yellow-200"
              >
                {pendingTimeOff} pending time-off
              </Link>
            )}
            {pendingSwaps > 0 && canViewAll && (
              <Link
                href="/dashboard/schedule/swaps"
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm hover:bg-purple-200"
              >
                {pendingSwaps} pending swaps
              </Link>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex items-center gap-4 mt-4">
          <Link
            href="/dashboard/schedule/shifts"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Manage Shift Templates
          </Link>
          <Link
            href="/dashboard/schedule/availability"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {canViewAll ? 'Employee Availability' : 'My Availability'}
          </Link>
          <Link
            href="/dashboard/schedule/time-off"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {canViewAll ? 'Time-Off Requests' : 'Request Time Off'}
          </Link>
          <Link
            href="/dashboard/schedule/swaps"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Shift Swaps
          </Link>
        </div>
      </div>

      {/* Main Calendar */}
      <div className="flex-1 min-h-0">
        <ScheduleCalendar
          initialEntries={entries}
          shifts={shifts}
          employees={employees}
          facilityId={user.facilityId}
          canEdit={canEdit}
          canPublish={canPublish}
        />
      </div>
    </div>
  )
}
