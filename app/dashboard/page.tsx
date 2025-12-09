'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Analytics {
  overview: {
    totalSubmissions: number
    draftSubmissions: number
    submittedCount: number
    totalIncidents: number
    recentIncidents: number
    activeUsers: number
    totalUsers: number
  }
  submissions: {
    byModule: {
      [key: string]: number
    }
    airQuality: number
    refrigeration: number
    iceDepth: number
    dailyChecklist: number
    incidents: number
  }
  schedule: {
    totalEntries: number
    openShifts: number
    filledShifts: number
    emergencyShifts: number
    coverageRate: string
  }
  trends: {
    submissions: Array<{ date: string; count: number }>
  }
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock user and facility - in production this would come from session
  const user = {
    firstName: 'Demo',
    lastName: 'User',
    facilityName: 'Demo Ice Rink',
    roleName: 'General Manager',
  }
  const facilityId = 'facility-demo'

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?facilityId=${facilityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const result = await response.json()
      setAnalytics(result.analytics)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">Dashboard</h1>
          <p className="text-wolf-600 mt-2">Loading your facility overview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-wolf-200 pb-4">
        <h1 className="text-3xl font-bold text-navy">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-wolf-600 mt-2">
          {user.facilityName} • {user.roleName}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{analytics?.overview.totalSubmissions || 0}</div>
            <p className="text-xs text-wolf-500 mt-1">
              {analytics?.overview.draftSubmissions || 0} drafts, {analytics?.overview.submittedCount || 0} submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{analytics?.overview.totalIncidents || 0}</div>
            <p className="text-xs text-wolf-500 mt-1">
              {analytics?.overview.recentIncidents || 0} in last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Schedule Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{analytics?.schedule.coverageRate || 0}%</div>
            <p className="text-xs text-wolf-500 mt-1">
              {analytics?.schedule.filledShifts || 0} of {analytics?.schedule.totalEntries || 0} shifts filled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{analytics?.overview.activeUsers || 0}</div>
            <p className="text-xs text-wolf-500 mt-1">
              of {analytics?.overview.totalUsers || 0} total users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(analytics?.schedule.emergencyShifts || 0) > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🚨</span>
            <div>
              <h3 className="font-semibold text-red-800">Emergency Shifts Need Coverage</h3>
              <p className="text-sm text-red-700">
                {analytics.schedule.emergencyShifts} emergency {analytics.schedule.emergencyShifts === 1 ? 'shift needs' : 'shifts need'} immediate coverage.{' '}
                <Link href="/dashboard/open-shifts" className="underline font-medium">
                  View open shifts
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {(analytics?.schedule.openShifts || 0) > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📢</span>
            <div>
              <h3 className="font-semibold text-orange-800">Open Shifts Available</h3>
              <p className="text-sm text-orange-700">
                {analytics.schedule.openShifts} open {analytics.schedule.openShifts === 1 ? 'shift is' : 'shifts are'} available to claim.{' '}
                <Link href="/dashboard/open-shifts" className="underline font-medium">
                  Claim a shift
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reports Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/ice-depth" className="flex items-center justify-between p-3 rounded-lg hover:bg-wolf-50 transition-colors border border-wolf-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">❄️</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy">Ice Depth</p>
                    <p className="text-xs text-wolf-500">{analytics?.submissions.iceDepth || 0} reports</p>
                  </div>
                </div>
                <Badge variant="default">{analytics?.submissions.iceDepth || 0}</Badge>
              </Link>

              <Link href="/dashboard/refrigeration" className="flex items-center justify-between p-3 rounded-lg hover:bg-wolf-50 transition-colors border border-wolf-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🌡️</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy">Refrigeration</p>
                    <p className="text-xs text-wolf-500">{analytics?.submissions.refrigeration || 0} reports</p>
                  </div>
                </div>
                <Badge variant="default">{analytics?.submissions.refrigeration || 0}</Badge>
              </Link>

              <Link href="/dashboard/air-quality" className="flex items-center justify-between p-3 rounded-lg hover:bg-wolf-50 transition-colors border border-wolf-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">💨</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy">Air Quality</p>
                    <p className="text-xs text-wolf-500">{analytics?.submissions.airQuality || 0} reports</p>
                  </div>
                </div>
                <Badge variant="default">{analytics?.submissions.airQuality || 0}</Badge>
              </Link>

              <Link href="/dashboard/incidents" className="flex items-center justify-between p-3 rounded-lg hover:bg-wolf-50 transition-colors border border-wolf-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">⚠️</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy">Incidents</p>
                    <p className="text-xs text-wolf-500">{analytics?.submissions.incidents || 0} reports</p>
                  </div>
                </div>
                <Badge variant="destructive">{analytics?.submissions.incidents || 0}</Badge>
              </Link>

              <Link href="/dashboard/checklists" className="flex items-center justify-between p-3 rounded-lg hover:bg-wolf-50 transition-colors border border-wolf-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">✅</span>
                  </div>
                  <div>
                    <p className="font-medium text-navy">Daily Checklists</p>
                    <p className="text-xs text-wolf-500">{analytics?.submissions.dailyChecklist || 0} completed</p>
                  </div>
                </div>
                <Badge variant="success">{analytics?.submissions.dailyChecklist || 0}</Badge>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/dashboard/ice-depth" className="flex items-center p-3 rounded-lg hover:bg-action-green hover:text-white transition-colors border border-wolf-200 hover:border-action-green">
                <span className="text-xl mr-3">📝</span>
                <span className="font-medium">Submit Ice Depth Report</span>
              </Link>

              <Link href="/dashboard/incidents" className="flex items-center p-3 rounded-lg hover:bg-action-green hover:text-white transition-colors border border-wolf-200 hover:border-action-green">
                <span className="text-xl mr-3">🚨</span>
                <span className="font-medium">Report an Incident</span>
              </Link>

              <Link href="/dashboard/checklists" className="flex items-center p-3 rounded-lg hover:bg-action-green hover:text-white transition-colors border border-wolf-200 hover:border-action-green">
                <span className="text-xl mr-3">✅</span>
                <span className="font-medium">Complete Daily Checklist</span>
              </Link>

              <Link href="/dashboard/schedule" className="flex items-center p-3 rounded-lg hover:bg-action-green hover:text-white transition-colors border border-wolf-200 hover:border-action-green">
                <span className="text-xl mr-3">📅</span>
                <span className="font-medium">View Schedule</span>
              </Link>

              <Link href="/dashboard/open-shifts" className="flex items-center p-3 rounded-lg hover:bg-action-green hover:text-white transition-colors border border-wolf-200 hover:border-action-green">
                <span className="text-xl mr-3">🤝</span>
                <span className="font-medium">Claim Open Shifts</span>
              </Link>

              <Link href="/dashboard/notifications" className="flex items-center p-3 rounded-lg hover:bg-action-green hover:text-white transition-colors border border-wolf-200 hover:border-action-green">
                <span className="text-xl mr-3">🔔</span>
                <span className="font-medium">View Notifications</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Trend */}
      {analytics?.trends.submissions && analytics.trends.submissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Submission Activity (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {analytics.trends.submissions.map((day: any, index: number) => {
                const maxCount = Math.max(...analytics.trends.submissions.map((d: any) => d.count))
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-action-green rounded-t transition-all hover:bg-navy"
                      style={{ height: `${height}%`, minHeight: day.count > 0 ? '10%' : '0%' }}
                    />
                    <p className="text-xs text-wolf-600 mt-2">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className="text-xs font-semibold text-navy">{day.count}</p>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
