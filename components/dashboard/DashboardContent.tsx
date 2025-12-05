'use client'

import { useState, useEffect } from 'react'
import {
  StatsCard,
  StatsCardSkeleton,
  TrendChart,
  ModuleChart,
  ChartSkeleton,
  ActivityFeed,
  ActivityFeedSkeleton,
  QuickActions,
} from './index'

interface DashboardData {
  stats: {
    todaySubmissions: number
    weekSubmissions: number
    monthSubmissions: number
    pendingApprovals: number | null
    myDrafts: number
    recentIncidents: number
  }
  moduleStats: Record<string, number>
  dailyTrend: { date: string; label: string; count: number }[]
  recentActivity: {
    id: string
    action: string
    entityType: string
    entityId: string
    user: string
    createdAt: string
  }[]
}

interface DashboardContentProps {
  userName: string
  facilityName: string
  roleName: string
  accessibleModules: string[]
  canApprove: boolean
}

export function DashboardContent({
  userName,
  facilityName,
  roleName,
  accessibleModules,
  canApprove,
}: DashboardContentProps) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch dashboard data')
      const data = await res.json()
      setData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Build quick actions based on accessible modules
  const quickActions = []
  if (accessibleModules.includes('Ice Depth')) {
    quickActions.push({
      label: 'Ice Depth',
      href: '/dashboard/ice-depth/new',
      icon: <span>📏</span>,
      color: 'blue' as const,
    })
  }
  if (accessibleModules.includes('Ice Operations')) {
    quickActions.push({
      label: 'Ice Ops',
      href: '/dashboard/ice-operations/new',
      icon: <span>🏒</span>,
      color: 'green' as const,
    })
  }
  if (accessibleModules.includes('Incidents')) {
    quickActions.push({
      label: 'Incident',
      href: '/dashboard/incidents/new',
      icon: <span>⚠️</span>,
      color: 'red' as const,
    })
  }
  if (accessibleModules.includes('Air Quality')) {
    quickActions.push({
      label: 'Air Quality',
      href: '/dashboard/air-quality/new',
      icon: <span>🌡️</span>,
      color: 'yellow' as const,
    })
  }
  if (accessibleModules.includes('Daily Checklist')) {
    quickActions.push({
      label: 'Checklist',
      href: '/dashboard/checklists/new',
      icon: <span>✓</span>,
      color: 'purple' as const,
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600 mt-1">
          {facilityName} &bull; {roleName}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : data ? (
          <>
            <StatsCard
              title="Today's Submissions"
              value={data.stats.todaySubmissions}
              subtitle="Reports submitted today"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              color="blue"
            />
            <StatsCard
              title="This Week"
              value={data.stats.weekSubmissions}
              subtitle="Submissions this week"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
              color="green"
            />
            {canApprove && data.stats.pendingApprovals !== null && (
              <StatsCard
                title="Pending Approval"
                value={data.stats.pendingApprovals}
                subtitle="Awaiting your review"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                color="yellow"
                href="/dashboard/incidents"
              />
            )}
            <StatsCard
              title="My Drafts"
              value={data.stats.myDrafts}
              subtitle="Incomplete reports"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              }
              color="gray"
            />
            <StatsCard
              title="Incidents This Month"
              value={data.stats.recentIncidents}
              subtitle="Reported incidents"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              color="red"
              href="/dashboard/incidents"
            />
          </>
        ) : null}
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="mb-8">
          <QuickActions actions={quickActions} title="Quick Report" />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {loading ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : data ? (
          <>
            <TrendChart
              title="Submissions (Last 7 Days)"
              data={data.dailyTrend.map((d) => ({
                label: d.label,
                value: d.count,
              }))}
            />
            <ModuleChart
              title="Submissions by Module (This Month)"
              data={data.moduleStats}
            />
          </>
        ) : null}
      </div>

      {/* Activity Feed */}
      <div className="mb-8">
        {loading ? (
          <ActivityFeedSkeleton />
        ) : data ? (
          <ActivityFeed activities={data.recentActivity} />
        ) : null}
      </div>

      {/* Module Access */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Module Access</h3>
        <div className="flex flex-wrap gap-2">
          {accessibleModules.map((module) => (
            <span
              key={module}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
            >
              {module}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
