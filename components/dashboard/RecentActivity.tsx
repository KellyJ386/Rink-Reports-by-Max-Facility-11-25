'use client'

import Link from 'next/link'

interface ActivityItem {
  id: string
  templateName: string
  submittedBy: string
  submittedAt: string
  status: string
}

interface RecentActivityProps {
  items: ActivityItem[]
  title?: string
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export default function RecentActivity({
  items,
  title = 'Recent Submissions',
}: RecentActivityProps) {
  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <Link
          href="/dashboard/submissions"
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          View all
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="p-4 text-center text-gray-500 text-sm">
          No recent submissions
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/dashboard/submissions/${item.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.templateName}
                </p>
                <p className="text-xs text-gray-500">
                  by {item.submittedBy}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${
                    STATUS_COLORS[item.status] || STATUS_COLORS.draft
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {formatTimeAgo(item.submittedAt)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
