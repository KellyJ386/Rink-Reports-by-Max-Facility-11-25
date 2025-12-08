'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AdminStats {
  forms: { active: number; newThisMonth: number }
  submissions: { total: number; thisWeek: number }
  users: { active: number; onlineRecently: number }
  reviews: { pending: number; urgent: number }
  programs: { active: number }
  shifts: { active: number }
  rinks: { active: number }
  activity: Array<{
    id: string
    type: string
    title: string
    user: string
    rink: string
    status: string
    timestamp: string
  }>
}

const MODULE_ICONS: Record<string, string> = {
  ICE_DEPTH: '📏',
  ICE_OPERATIONS: '🧊',
  REFRIGERATION: '❄️',
  AIR_QUALITY: '💨',
  INCIDENT: '🚨',
  SCHEDULE: '📅',
  DAILY_CHECKLIST: '✅'
}

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'bg-blue-100 text-blue-700',
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700'
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Create Form Template',
      description: 'Build a new custom form for data collection',
      href: '/dashboard/admin/forms/new',
      icon: '📝',
      color: 'bg-blue-500'
    },
    {
      title: 'Manage Users',
      description: 'Add, edit, or remove user accounts',
      href: '/dashboard/admin/users',
      icon: '👥',
      color: 'bg-green-500'
    },
    {
      title: 'Manage Programs',
      description: 'Set up skating programs and activities',
      href: '/dashboard/admin/programs',
      icon: '⛸️',
      color: 'bg-cyan-500'
    },
    {
      title: 'Manage Shifts',
      description: 'Configure shift definitions and schedules',
      href: '/dashboard/admin/shifts',
      icon: '⏰',
      color: 'bg-orange-500'
    },
    {
      title: 'Facility Settings',
      description: 'Configure facility-wide settings',
      href: '/dashboard/admin/settings',
      icon: '⚙️',
      color: 'bg-purple-500'
    }
  ]

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
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading admin dashboard...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Active Forms</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats?.forms.active ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {stats?.forms.newThisMonth ? `+${stats.forms.newThisMonth} this month` : 'No new forms'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Total Submissions</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats?.submissions.total?.toLocaleString() ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {stats?.submissions.thisWeek ? `+${stats.submissions.thisWeek} this week` : 'No submissions this week'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats?.users.active ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {stats?.users.onlineRecently ? `${stats.users.onlineRecently} online recently` : 'No recent logins'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-500">Pending Reviews</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats?.reviews.pending ?? 0}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {stats?.reviews.urgent ? (
              <span className="text-red-500">{stats.reviews.urgent} urgent</span>
            ) : (
              'No urgent reviews'
            )}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center text-2xl">
            ⛸️
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.programs.active ?? 0}</p>
            <p className="text-sm text-gray-500">Active Programs</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">
            ⏰
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.shifts.active ?? 0}</p>
            <p className="text-sm text-gray-500">Shift Definitions</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
            🏟️
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats?.rinks.active ?? 0}</p>
            <p className="text-sm text-gray-500">Active Rinks</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow group"
          >
            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>
              {action.icon}
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {action.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      <div className="bg-white rounded-lg shadow-sm">
        {!stats?.activity || stats.activity.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No recent activity. Submissions will appear here once forms are used.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {stats.activity.map((item) => (
              <div key={item.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{MODULE_ICONS[item.type] || '📋'}</span>
                    <div>
                      <div className="font-medium text-gray-900">{item.title}</div>
                      <div className="text-sm text-gray-500">
                        {item.user} • {item.rink}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-400">{formatTimeAgo(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
