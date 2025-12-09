'use client'

interface ActivityItem {
  id: string
  action: string
  entityType: string
  entityId: string
  user: string
  createdAt: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
  title?: string
}

const actionLabels: Record<string, string> = {
  CREATE: 'created',
  UPDATE: 'updated',
  DELETE: 'deleted',
  ARCHIVE: 'archived',
  APPROVE: 'approved',
  REJECT: 'rejected',
  LOGIN: 'logged in',
  LOGOUT: 'logged out',
}

const actionIcons: Record<string, { icon: string; color: string }> = {
  CREATE: { icon: '+', color: 'bg-green-100 text-green-600' },
  UPDATE: { icon: '~', color: 'bg-blue-100 text-blue-600' },
  DELETE: { icon: 'x', color: 'bg-red-100 text-red-600' },
  ARCHIVE: { icon: '📦', color: 'bg-gray-100 text-gray-600' },
  APPROVE: { icon: '✓', color: 'bg-green-100 text-green-600' },
  REJECT: { icon: '✕', color: 'bg-red-100 text-red-600' },
  LOGIN: { icon: '→', color: 'bg-blue-100 text-blue-600' },
  LOGOUT: { icon: '←', color: 'bg-gray-100 text-gray-600' },
}

const entityLabels: Record<string, string> = {
  Submission: 'submission',
  FormTemplate: 'form template',
  User: 'user',
  ScheduleEntry: 'schedule entry',
}

export function ActivityFeed({ activities, title = 'Recent Activity' }: ActivityFeedProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (activities.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center text-gray-500 py-8">
          No recent activity
        </div>
      </div>
    )
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const actionConfig = actionIcons[activity.action] || { icon: '•', color: 'bg-gray-100 text-gray-600' }
          return (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${actionConfig.color}`}>
                {actionConfig.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user}</span>
                  {' '}
                  <span className="text-gray-600">
                    {actionLabels[activity.action] || activity.action.toLowerCase()}
                  </span>
                  {' '}
                  <span className="text-gray-600">
                    {entityLabels[activity.entityType] || activity.entityType.toLowerCase()}
                  </span>
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatTime(activity.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ActivityFeedSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 w-48 bg-gray-200 rounded" />
              <div className="h-3 w-16 bg-gray-200 rounded mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
