'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { StatCard, TrendsChart, DistributionChart, RecentActivity } from './index'

interface AnalyticsData {
  summary: {
    totalSubmissions: number
    pendingReview: number
    approved: number
    rejected: number
    drafts: number
    approvalRate: number
  }
  trends: Array<{
    date: string
    total: number
    submitted: number
    approved: number
    rejected: number
  }>
  byTemplate: Array<{
    templateId: string
    templateName: string
    count: number
  }>
  byRink: Array<{
    rinkId: string | null
    rinkName: string
    count: number
  }>
  recentSubmissions: Array<{
    id: string
    templateName: string
    submittedBy: string
    submittedAt: string
    status: string
  }>
}

interface DashboardClientProps {
  user: {
    firstName: string
    facilityName: string
    roleName: string
    isAdmin: boolean
  }
  accessibleModules: string[]
}

export default function DashboardClient({ user, accessibleModules }: DashboardClientProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const data = await res.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const handleExport = async () => {
    try {
      const res = await fetch(`/api/analytics/export?format=csv&period=${period}`)
      if (!res.ok) throw new Error('Export failed')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `submissions-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-500 mt-1">
            {user.facilityName} &bull; {user.roleName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          {user.isAdmin && (
            <button onClick={handleExport} className="btn btn-secondary text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          )}

          <Link href="/dashboard/forms" className="btn btn-primary text-sm">
            New Submission
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      ) : analytics ? (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Total Submissions"
              value={analytics.summary.totalSubmissions}
              color="blue"
              icon={
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
            <StatCard
              title="Pending Review"
              value={analytics.summary.pendingReview}
              color="yellow"
              icon={
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Approved"
              value={analytics.summary.approved}
              color="green"
              icon={
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Approval Rate"
              value={`${analytics.summary.approvalRate}%`}
              subtitle={`${analytics.summary.approved + analytics.summary.rejected} reviewed`}
              color="gray"
              icon={
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <TrendsChart data={analytics.trends} title={`Submissions (Last ${period} days)`} />
            </div>
            <DistributionChart
              data={analytics.byTemplate.slice(0, 5).map((t) => ({
                label: t.templateName,
                value: t.count,
              }))}
              title="By Form Type"
              type="donut"
            />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <RecentActivity items={analytics.recentSubmissions} />

            {analytics.byRink.length > 0 && (
              <DistributionChart
                data={analytics.byRink.slice(0, 5).map((r) => ({
                  label: r.rinkName,
                  value: r.count,
                }))}
                title="Submissions by Rink"
                type="bar"
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/forms" className="btn btn-secondary text-sm">
                Fill Out Form
              </Link>
              <Link href="/dashboard/submissions" className="btn btn-secondary text-sm">
                View My Submissions
              </Link>
              {user.isAdmin && (
                <>
                  <Link href="/dashboard/admin/submissions" className="btn btn-secondary text-sm">
                    Review Submissions
                  </Link>
                  <Link href="/dashboard/admin/forms" className="btn btn-secondary text-sm">
                    Manage Forms
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      )}

      {/* Module Access */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Access</h3>
        <div className="flex flex-wrap gap-2">
          {accessibleModules.map((module) => (
            <span
              key={module}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize"
            >
              {module}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
