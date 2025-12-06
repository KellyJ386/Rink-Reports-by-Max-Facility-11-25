'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  users: {
    active: number
    total: number
  }
  schedule: {
    todayShifts: number
    openShifts: number
    myUpcomingShifts: number
    todayCoverage: number
    total: number
    filled: number
    open: number
    coverage: number
  } | null
  iceDepth: {
    readingsThisWeek: number
    rinksWithIssues: number
    summary: Array<{
      rinkId: string
      rinkName: string
      lastReading: {
        id: string
        averageDepth: number
        targetDepth: number
        hasIssues: boolean
        recordedAt: string
      } | null
    }>
  } | null
  notifications: {
    unread: number
  }
  facility: {
    rinks: number
  }
  activity: Array<{
    id: string
    type: string
    title: string
    module: string
    user: string
    timestamp: string
  }>
}

const MODULE_ICONS: Record<string, string> = {
  ICE_DEPTH: '📏',
  ICE_OPERATIONS: '🏒',
  REFRIGERATION: '❄️',
  AIR_QUALITY: '🌡️',
  INCIDENTS: '⚠️',
  DAILY_CHECKLIST: '✓',
  unknown: '📝'
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          setError('Failed to load dashboard data')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 300000)
    return () => clearInterval(interval)
  }, [])

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of your facility operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Users Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.users.active || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {stats?.users.total || 0} total users
          </div>
        </div>

        {/* Schedule Card */}
        {stats?.schedule && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Today&apos;s Coverage</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.schedule.coverage}%
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stats.schedule.coverage >= 80
                  ? 'bg-green-100'
                  : stats.schedule.coverage >= 50
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
              }`}>
                <span className="text-2xl">📅</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{stats.schedule.filled} filled</span>
                {stats.schedule.open > 0 && (
                  <span className="text-orange-600 font-medium">
                    {stats.schedule.open} open
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ice Depth Card */}
        {stats?.iceDepth && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ice Readings (7d)</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.iceDepth.readingsThisWeek}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                stats.iceDepth.rinksWithIssues > 0 ? 'bg-yellow-100' : 'bg-cyan-100'
              }`}>
                <span className="text-2xl">📏</span>
              </div>
            </div>
            <div className="mt-4 text-sm">
              {stats.iceDepth.rinksWithIssues > 0 ? (
                <span className="text-yellow-600">
                  {stats.iceDepth.rinksWithIssues} reading{stats.iceDepth.rinksWithIssues !== 1 ? 's' : ''} with issues
                </span>
              ) : (
                <span className="text-green-600">All readings normal</span>
              )}
            </div>
          </div>
        )}

        {/* Notifications Card */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unread Notifications</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats?.notifications.unread || 0}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              (stats?.notifications.unread || 0) > 0 ? 'bg-red-100' : 'bg-gray-100'
            }`}>
              <span className="text-2xl">🔔</span>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/dashboard/notifications"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats?.activity && stats.activity.length > 0 ? (
              stats.activity.map(item => (
                <div key={item.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">
                      {MODULE_ICONS[item.module] || MODULE_ICONS.unknown}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {item.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {item.user}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Info - Takes 1 column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {stats?.iceDepth && (
                <Link
                  href="/dashboard/ice-depth/record"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-xl">📏</span>
                  <span className="text-sm font-medium text-gray-700">Record Ice Depth</span>
                </Link>
              )}
              {stats?.schedule && (
                <>
                  <Link
                    href="/dashboard/schedule"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-xl">📅</span>
                    <span className="text-sm font-medium text-gray-700">View Schedule</span>
                  </Link>
                  {stats.schedule.openShifts > 0 && (
                    <Link
                      href="/dashboard/schedule/open-shifts"
                      className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors"
                    >
                      <span className="text-xl">🆘</span>
                      <span className="text-sm font-medium text-orange-700">
                        {stats.schedule.openShifts} Open Shift{stats.schedule.openShifts !== 1 ? 's' : ''}
                      </span>
                    </Link>
                  )}
                </>
              )}
              <Link
                href="/dashboard/notifications"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl">🔔</span>
                <span className="text-sm font-medium text-gray-700">Notifications</span>
              </Link>
            </div>
          </div>

          {/* Ice Depth Summary */}
          {stats?.iceDepth && stats.iceDepth.summary.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Rink Status</h2>
              <div className="space-y-3">
                {stats.iceDepth.summary.map(rink => (
                  <div key={rink.rinkId} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{rink.rinkName}</p>
                      {rink.lastReading ? (
                        <p className="text-xs text-gray-500">
                          {rink.lastReading.averageDepth.toFixed(2)}&quot; avg
                          <span className="mx-1">•</span>
                          {formatTimeAgo(rink.lastReading.recordedAt)}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400">No readings</p>
                      )}
                    </div>
                    {rink.lastReading && (
                      <div className={`w-3 h-3 rounded-full ${
                        rink.lastReading.hasIssues
                          ? 'bg-yellow-400'
                          : 'bg-green-400'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  href="/dashboard/ice-depth"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View ice depth details →
                </Link>
              </div>
            </div>
          )}

          {/* My Shifts */}
          {stats?.schedule && stats.schedule.myUpcomingShifts > 0 && (
            <div className="bg-blue-50 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    You have {stats.schedule.myUpcomingShifts} upcoming shift{stats.schedule.myUpcomingShifts !== 1 ? 's' : ''}
                  </p>
                  <Link
                    href="/dashboard/schedule/my-schedule"
                    className="text-sm text-blue-700 hover:text-blue-900"
                  >
                    View my schedule →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {stats?.iceDepth && stats.iceDepth.rinksWithIssues > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Ice Depth Alert
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {stats.iceDepth.rinksWithIssues} rink{stats.iceDepth.rinksWithIssues !== 1 ? 's' : ''} with
                    readings outside target range
                  </p>
                  <Link
                    href="/dashboard/ice-depth"
                    className="text-sm text-yellow-800 hover:text-yellow-900 font-medium mt-2 inline-block"
                  >
                    Review readings →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
