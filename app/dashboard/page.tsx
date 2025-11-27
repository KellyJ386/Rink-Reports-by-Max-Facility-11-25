'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DashboardStats {
  todaySubmissions: number
  weekSubmissions: number
  openShifts: number
  pendingIncidents: number
  lastAirQuality: {
    coPpm: number
    no2Ppm: number
    submittedAt: string
    status: 'normal' | 'warning' | 'danger'
  } | null
  recentActivity: Array<{
    id: string
    type: string
    module: string
    description: string
    submittedAt: string
    submittedBy: string
  }>
  alerts: Array<{
    id: string
    type: 'warning' | 'danger' | 'info'
    title: string
    message: string
    module: string
    link?: string
  }>
}

interface UserInfo {
  id: string
  firstName: string
  facilityId: string
  facility: { name: string }
  role: {
    name: string
    permissions: any
  }
}

const MODULE_ICONS: Record<string, string> = {
  'ICE_DEPTH': 'Ice Depth',
  'ICE_OPERATIONS': 'Ice Ops',
  'REFRIGERATION': 'Refrigeration',
  'AIR_QUALITY': 'Air Quality',
  'INCIDENT': 'Incident',
  'DAILY_CHECKLIST': 'Checklist',
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch user info and dashboard stats in parallel
      const [meRes, statsRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/dashboard/stats'),
      ])

      if (meRes.ok) {
        const meData = await meRes.json()
        setUser(meData.user)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {user.firstName}!
      </h1>
      <p className="text-gray-600 mb-8">
        {user.facility.name} • {user.role.name}
      </p>

      {/* Alerts */}
      {stats?.alerts && stats.alerts.length > 0 && (
        <div className="space-y-3 mb-8">
          {stats.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border-l-4 ${
                alert.type === 'danger'
                  ? 'bg-red-50 border-red-500'
                  : alert.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-500'
                  : 'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-semibold ${
                    alert.type === 'danger' ? 'text-red-800' :
                    alert.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                  }`}>
                    {alert.title}
                  </h3>
                  <p className={`text-sm ${
                    alert.type === 'danger' ? 'text-red-700' :
                    alert.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'
                  }`}>
                    {alert.message}
                  </p>
                </div>
                {alert.link && (
                  <Link href={alert.link} className="btn btn-secondary text-sm">
                    View
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">Today's Submissions</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.todaySubmissions ?? 0}</div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 mb-1">This Week</div>
          <div className="text-3xl font-bold text-gray-900">{stats?.weekSubmissions ?? 0}</div>
        </div>
        <Link href="/dashboard/schedule/open" className="card hover:ring-2 hover:ring-blue-300 transition">
          <div className="text-sm text-gray-500 mb-1">Open Shifts</div>
          <div className={`text-3xl font-bold ${stats?.openShifts ? 'text-orange-600' : 'text-gray-900'}`}>
            {stats?.openShifts ?? 0}
          </div>
        </Link>
        <Link href="/dashboard/incidents" className="card hover:ring-2 hover:ring-blue-300 transition">
          <div className="text-sm text-gray-500 mb-1">Open Incidents</div>
          <div className={`text-3xl font-bold ${stats?.pendingIncidents ? 'text-red-600' : 'text-gray-900'}`}>
            {stats?.pendingIncidents ?? 0}
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Air Quality Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Air Quality Status</h2>
          {stats?.lastAirQuality ? (
            <div>
              <div className={`p-4 rounded-lg mb-3 ${
                stats.lastAirQuality.status === 'danger' ? 'bg-red-100' :
                stats.lastAirQuality.status === 'warning' ? 'bg-yellow-100' : 'bg-green-100'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-lg font-semibold ${
                    stats.lastAirQuality.status === 'danger' ? 'text-red-800' :
                    stats.lastAirQuality.status === 'warning' ? 'text-yellow-800' : 'text-green-800'
                  }`}>
                    {stats.lastAirQuality.status === 'danger' ? 'DANGER' :
                     stats.lastAirQuality.status === 'warning' ? 'Warning' : 'Normal'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {new Date(stats.lastAirQuality.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-600">CO</span>
                    <div className="text-2xl font-bold">{stats.lastAirQuality.coPpm} ppm</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">NO2</span>
                    <div className="text-2xl font-bold">{stats.lastAirQuality.no2Ppm} ppm</div>
                  </div>
                </div>
              </div>
              <Link href="/dashboard/air-quality" className="text-blue-600 text-sm hover:underline">
                View all readings →
              </Link>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p className="mb-2">No recent air quality readings</p>
              <Link href="/dashboard/air-quality/new" className="btn btn-primary text-sm">
                Take Reading
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">
                    {MODULE_ICONS[activity.module]?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.submittedBy} • {new Date(activity.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/dashboard/ice-depth/new" className="p-4 bg-blue-50 rounded-lg text-center hover:bg-blue-100 transition">
            <div className="text-2xl mb-1">Ice</div>
            <div className="text-sm font-medium text-blue-900">Ice Depth</div>
          </Link>
          <Link href="/dashboard/refrigeration/new" className="p-4 bg-purple-50 rounded-lg text-center hover:bg-purple-100 transition">
            <div className="text-2xl mb-1">Temp</div>
            <div className="text-sm font-medium text-purple-900">Refrigeration</div>
          </Link>
          <Link href="/dashboard/air-quality/new" className="p-4 bg-green-50 rounded-lg text-center hover:bg-green-100 transition">
            <div className="text-2xl mb-1">Air</div>
            <div className="text-sm font-medium text-green-900">Air Quality</div>
          </Link>
          <Link href="/dashboard/incidents/new" className="p-4 bg-red-50 rounded-lg text-center hover:bg-red-100 transition">
            <div className="text-2xl mb-1">Alert</div>
            <div className="text-sm font-medium text-red-900">Report Incident</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
