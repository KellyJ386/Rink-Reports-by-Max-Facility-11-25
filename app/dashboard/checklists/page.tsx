import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canUserAccess } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const CHECKLIST_TYPES = {
  opening: { label: 'Opening', icon: '🌅', color: 'bg-yellow-100 text-yellow-800' },
  closing: { label: 'Closing', icon: '🌙', color: 'bg-indigo-100 text-indigo-800' },
  safety: { label: 'Safety', icon: '🛡️', color: 'bg-red-100 text-red-800' },
  equipment: { label: 'Equipment', icon: '🔧', color: 'bg-blue-100 text-blue-800' },
  maintenance: { label: 'Maintenance', icon: '🔨', color: 'bg-orange-100 text-orange-800' },
}

function getCompletionStatus(completed: number, total: number) {
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
  if (percentage === 100) return { label: 'Complete', color: 'bg-green-100 text-green-800' }
  if (percentage >= 50) return { label: `${percentage}%`, color: 'bg-yellow-100 text-yellow-800' }
  return { label: `${percentage}%`, color: 'bg-red-100 text-red-800' }
}

export default async function ChecklistsPage() {
  const user = await getSession()

  if (!user) {
    redirect('/login')
  }

  if (!canUserAccess(user, 'dailyChecklist', 'access')) {
    redirect('/dashboard')
  }

  const canSubmit = canUserAccess(user, 'dailyChecklist', 'submit')
  const canViewAll = canUserAccess(user, 'dailyChecklist', 'viewAll')

  const rinks = await prisma.rink.findMany({
    where: { facility: { id: user.facilityId }, isActive: true },
    orderBy: { name: 'asc' },
  })

  const submissions = await prisma.submission.findMany({
    where: {
      formTemplate: {
        facilityId: user.facilityId,
        moduleType: 'DAILY_CHECKLIST',
      },
      ...(canViewAll ? {} : { submittedById: user.id }),
      archivedAt: null,
    },
    include: {
      rink: { select: { id: true, name: true } },
      submittedBy: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { submittedAt: 'desc' },
    take: 100,
  })

  // Get today's checklists
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayChecklists = submissions.filter((s) => {
    const submitted = new Date(s.submittedAt)
    submitted.setHours(0, 0, 0, 0)
    return submitted.getTime() === today.getTime()
  })

  // Calculate stats
  const stats = {
    todayTotal: todayChecklists.length,
    todayComplete: todayChecklists.filter((s) => {
      const data = s.data as any
      return data?.allItemsChecked || data?.completionPercentage === 100
    }).length,
    weekTotal: submissions.filter((s) => {
      const submitted = new Date(s.submittedAt)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      return submitted >= weekAgo
    }).length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Checklists</h1>
          <p className="text-gray-600 text-sm mt-1">Track daily operations and safety checks</p>
        </div>
        {canSubmit && (
          <Link href="/dashboard/checklists/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Checklist
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.todayTotal}</div>
          <div className="text-sm text-gray-500">Today's Checklists</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.todayComplete}</div>
          <div className="text-sm text-gray-500">Completed Today</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.weekTotal}</div>
          <div className="text-sm text-gray-500">This Week</div>
        </div>
      </div>

      {/* Quick Start Buttons */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(CHECKLIST_TYPES).map(([key, type]) => (
            <Link
              key={key}
              href={`/dashboard/checklists/new?type=${key}`}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg ${type.color} hover:opacity-80 transition-opacity`}
            >
              <span className="text-xl">{type.icon}</span>
              <span className="font-medium">{type.label} Checklist</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Progress */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress by Rink</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rinks.map((rink) => {
            const rinkChecklists = todayChecklists.filter((c) => c.rinkId === rink.id)
            const hasOpening = rinkChecklists.some((c) => (c.data as any)?.checklistType === 'opening')
            const hasClosing = rinkChecklists.some((c) => (c.data as any)?.checklistType === 'closing')
            const hasSafety = rinkChecklists.some((c) => (c.data as any)?.checklistType === 'safety')

            return (
              <div key={rink.id} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3">{rink.name}</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Opening</span>
                    {hasOpening ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Safety</span>
                    {hasSafety ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Closing</span>
                    {hasClosing ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Checklists */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Checklists</h2>
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No checklists completed yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Type</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Rink</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Completed By</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.slice(0, 20).map((s) => {
                  const data = s.data as any
                  const type = CHECKLIST_TYPES[data?.checklistType as keyof typeof CHECKLIST_TYPES] || {
                    label: 'General',
                    icon: '📋',
                    color: 'bg-gray-100 text-gray-800',
                  }
                  const completed = data?.completedItems || 0
                  const total = data?.totalItems || 0
                  const status = getCompletionStatus(completed, total)

                  return (
                    <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="text-sm font-medium">{new Date(s.submittedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{new Date(s.submittedAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${type.color}`}>
                          <span>{type.icon}</span>
                          {type.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{s.rink.name}</td>
                      <td className="py-3 px-4 text-sm">
                        {s.submittedBy.firstName} {s.submittedBy.lastName}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/dashboard/checklists/${s.id}`} className="text-blue-600 hover:text-blue-700 text-sm font-medium">
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
