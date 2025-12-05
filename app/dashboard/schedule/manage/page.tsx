import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { canUserAccess } from '@/lib/permissions'
import Link from 'next/link'

export default async function ManageSchedulePage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  // Check if user has schedule management permission
  const canManage = canUserAccess(user, 'schedule', 'edit')
  if (!canManage) {
    redirect('/dashboard/schedule')
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/schedule"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Schedule</h1>
          <p className="text-gray-600 mt-1">
            Create, edit, and publish shift schedules
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Shifts */}
        <div className="card p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Shifts</h3>
          <p className="text-gray-600 text-sm mb-4">
            Add new shifts and assign operators to coverage slots
          </p>
          <Link href="/dashboard/schedule/create" className="btn btn-primary w-full">
            Create Shift
          </Link>
        </div>

        {/* Shift Templates */}
        <div className="card p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Shift Definitions</h3>
          <p className="text-gray-600 text-sm mb-4">
            Manage recurring shift templates (Morning, Evening, etc.)
          </p>
          <Link href="/dashboard/schedule/definitions" className="btn btn-secondary w-full">
            Manage Templates
          </Link>
        </div>

        {/* Publish Schedule */}
        <div className="card p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Publish Schedule</h3>
          <p className="text-gray-600 text-sm mb-4">
            Review and publish the weekly schedule to notify staff
          </p>
          <Link href="/dashboard/schedule/publish" className="btn btn-secondary w-full">
            Review & Publish
          </Link>
        </div>

        {/* Open Shifts */}
        <div className="card p-6">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Open Shifts</h3>
          <p className="text-gray-600 text-sm mb-4">
            Post shifts that need coverage for staff to pick up
          </p>
          <Link href="/dashboard/schedule/open-shifts" className="btn btn-secondary w-full">
            Manage Open Shifts
          </Link>
        </div>

        {/* Time Off Requests */}
        <div className="card p-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Time Off Requests</h3>
          <p className="text-gray-600 text-sm mb-4">
            Review and approve staff time off requests
          </p>
          <Link href="/dashboard/schedule/time-off" className="btn btn-secondary w-full">
            View Requests
          </Link>
        </div>

        {/* Schedule Reports */}
        <div className="card p-6">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule Reports</h3>
          <p className="text-gray-600 text-sm mb-4">
            View hours worked, coverage gaps, and scheduling metrics
          </p>
          <Link href="/dashboard/schedule/reports" className="btn btn-secondary w-full">
            View Reports
          </Link>
        </div>
      </div>
    </div>
  )
}
