import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const OPERATION_TYPES = {
  ice_make: { label: 'Ice Make', icon: '🧊', color: 'bg-blue-100 text-blue-800' },
  circle_check: { label: 'Circle Check', icon: '🔄', color: 'bg-green-100 text-green-800' },
  edging: { label: 'Edging', icon: '📐', color: 'bg-purple-100 text-purple-800' },
  blade_change: { label: 'Blade Change', icon: '🔪', color: 'bg-orange-100 text-orange-800' },
  resurfacing: { label: 'Resurfacing', icon: '🚜', color: 'bg-cyan-100 text-cyan-800' },
  other: { label: 'Other', icon: '📝', color: 'bg-gray-100 text-gray-800' },
}

export default async function IceOperationsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'iceOperations', 'access')) {
    redirect('/dashboard')
  }

  const canSubmit = canUserAccess(user, 'iceOperations', 'submit')
  const canViewAll = canUserAccess(user, 'iceOperations', 'viewAll')

  const rinks = await prisma.rink.findMany({
    where: { facility: { id: user.facilityId }, isActive: true },
    orderBy: { name: 'asc' },
  })

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: user.facilityId,
        moduleType: 'ICE_OPERATIONS',
      },
      ...(canViewAll ? {} : { submittedById: user.id }),
      archivedAt: null,
    },
    include: {
      rink: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 30,
  })

  // Group by date
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()

  const todayOps = submissions.filter((s) => new Date(s.submittedAt).toDateString() === today)
  const yesterdayOps = submissions.filter((s) => new Date(s.submittedAt).toDateString() === yesterday)
  const olderOps = submissions.filter(
    (s) => new Date(s.submittedAt).toDateString() !== today && new Date(s.submittedAt).toDateString() !== yesterday
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ice Operations</h1>
          <p className="text-gray-600 text-sm mt-1">Log ice makes, circle checks, edging, and more</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/ice-operations/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Log Operation
          </Link>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Today</div>
          <div className="text-2xl font-semibold">{todayOps.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">This Week</div>
          <div className="text-2xl font-semibold">
            {submissions.filter((s) => {
              const weekAgo = new Date(Date.now() - 7 * 86400000)
              return new Date(s.submittedAt) >= weekAgo
            }).length}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Rinks</div>
          <div className="text-2xl font-semibold">{rinks.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Total Logged</div>
          <div className="text-2xl font-semibold">{submissions.length}</div>
        </div>
      </div>

      {/* Operations List */}
      <div className="space-y-6">
        {todayOps.length > 0 && (
          <OperationsGroup title="Today" operations={todayOps} />
        )}
        {yesterdayOps.length > 0 && (
          <OperationsGroup title="Yesterday" operations={yesterdayOps} />
        )}
        {olderOps.length > 0 && (
          <OperationsGroup title="Earlier" operations={olderOps} />
        )}
        {submissions.length === 0 && (
          <div className="card text-center py-12">
            <div className="text-gray-400 text-4xl mb-3">🏒</div>
            <p className="text-gray-500 mb-4">No operations logged yet</p>
            {canSubmit && (
              <Link href="/dashboard/ice-operations/new" className="btn btn-primary">
                Log First Operation
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function OperationsGroup({ title, operations }: { title: string; operations: any[] }) {
  return (
    <div>
      <h2 className="text-sm font-medium text-gray-500 mb-3">{title}</h2>
      <div className="space-y-2">
        {operations.map((op) => {
          const data = op.data as any
          const opType = OPERATION_TYPES[data?.operationType as keyof typeof OPERATION_TYPES] || OPERATION_TYPES.other

          return (
            <Link
              key={op.id}
              href={`/dashboard/ice-operations/${op.id}`}
              className="card flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${opType.color}`}>
                {opType.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{opType.label}</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{op.rink.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {op.submittedBy.firstName} {op.submittedBy.lastName} • {new Date(op.submittedAt).toLocaleTimeString()}
                </div>
              </div>
              {data?.resurfacerHours && (
                <div className="text-right">
                  <div className="text-sm font-medium">{data.resurfacerHours} hrs</div>
                  <div className="text-xs text-gray-500">Resurfacer</div>
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
