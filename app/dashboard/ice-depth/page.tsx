import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function IceDepthPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'iceDepth', 'access')) {
    redirect('/dashboard')
  }

  const canSubmit = canUserAccess(user, 'iceDepth', 'submit')
  const canViewAll = canUserAccess(user, 'iceDepth', 'viewAll')

  // Get rinks for this facility
  const rinks = await prisma.rink.findMany({
    where: { facility: { id: user.facilityId }, isActive: true },
    orderBy: { name: 'asc' },
  })

  // Get recent submissions
  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: user.facilityId,
        moduleType: 'ICE_DEPTH',
      },
      ...(canViewAll ? {} : { submittedById: user.id }),
      archivedAt: null,
    },
    include: {
      rink: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 20,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ice Depth</h1>
          <p className="text-gray-600 text-sm mt-1">Track ice thickness measurements across your rinks</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/ice-depth/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Reading
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Readings</div>
          <div className="text-2xl font-semibold">{submissions.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Rinks</div>
          <div className="text-2xl font-semibold">{rinks.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Last Reading</div>
          <div className="text-sm font-medium">
            {submissions.length > 0
              ? new Date(submissions[0].submittedAt).toLocaleString()
              : 'No readings yet'}
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Readings</h2>

        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-3">📏</div>
            <p className="text-gray-500 mb-4">No ice depth readings yet</p>
            {canSubmit && (
              <Link href="/dashboard/ice-depth/new" className="btn btn-primary">
                Record First Reading
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date/Time</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rink</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Submitted By</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Avg Depth</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => {
                  const data = submission.data as any
                  const measurements = data?.measurements || []
                  const avgDepth = measurements.length > 0
                    ? (measurements.reduce((sum: number, m: any) => sum + (m.value || 0), 0) / measurements.length).toFixed(2)
                    : '--'

                  return (
                    <tr key={submission.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(submission.submittedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(submission.submittedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          {submission.rink.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium">{avgDepth}</span>
                        <span className="text-gray-400 text-sm ml-1">in</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/dashboard/ice-depth/${submission.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
