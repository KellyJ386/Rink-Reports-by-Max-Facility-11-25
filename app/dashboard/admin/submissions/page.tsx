'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { SubmissionStatus, SubmissionListItem } from '@/types/form-builder'

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  reviewed: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

interface Template {
  id: string
  name: string
}

interface Rink {
  id: string
  name: string
}

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [templateFilter, setTemplateFilter] = useState<string>('')
  const [rinkFilter, setRinkFilter] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  })

  const fetchFilters = useCallback(async () => {
    try {
      const [templatesRes, rinksRes] = await Promise.all([
        fetch('/api/forms'),
        fetch('/api/rinks'),
      ])

      if (templatesRes.ok) {
        const data = await templatesRes.json()
        setTemplates(data.templates || [])
      }

      if (rinksRes.ok) {
        const data = await rinksRes.json()
        setRinks(data.rinks || [])
      }
    } catch (err) {
      console.error('Error fetching filters:', err)
    }
  }, [])

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (statusFilter) params.set('status', statusFilter)
      if (templateFilter) params.set('templateId', templateFilter)
      if (rinkFilter) params.set('rinkId', rinkFilter)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/submissions?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch submissions')
      const data = await res.json()
      setSubmissions(data.submissions || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages,
      }))

      // Calculate stats from all submissions (ideally this would come from a separate endpoint)
      const allParams = new URLSearchParams()
      allParams.set('limit', '1000')
      const statsRes = await fetch(`/api/submissions?${allParams.toString()}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        const allSubs = statsData.submissions || []
        setStats({
          total: allSubs.length,
          submitted: allSubs.filter((s: SubmissionListItem) => s.status === 'submitted').length,
          approved: allSubs.filter((s: SubmissionListItem) => s.status === 'approved').length,
          rejected: allSubs.filter((s: SubmissionListItem) => s.status === 'rejected').length,
          pending: allSubs.filter((s: SubmissionListItem) => ['submitted', 'reviewed'].includes(s.status)).length,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, templateFilter, rinkFilter, startDate, endDate])

  useEffect(() => {
    fetchFilters()
  }, [fetchFilters])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const resetFilters = () => {
    setStatusFilter('')
    setTemplateFilter('')
    setRinkFilter('')
    setStartDate('')
    setEndDate('')
    setPagination((p) => ({ ...p, page: 1 }))
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Submissions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review and manage form submissions across your facility
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
          <div className="text-sm text-gray-500">Pending Review</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
          <div className="text-sm text-gray-500">Submitted</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          <div className="text-sm text-gray-500">Approved</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          <div className="text-sm text-gray-500">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="input text-sm"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Form</label>
            <select
              value={templateFilter}
              onChange={(e) => {
                setTemplateFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="input text-sm"
            >
              <option value="">All Forms</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Rink</label>
            <select
              value={rinkFilter}
              onChange={(e) => {
                setRinkFilter(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="input text-sm"
            >
              <option value="">All Rinks</option>
              {rinks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPagination((p) => ({ ...p, page: 1 }))
              }}
              className="input text-sm"
            />
          </div>

          <button onClick={resetFilters} className="btn btn-secondary text-sm">
            Reset Filters
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* Submissions Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading submissions...</div>
        ) : submissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No submissions found matching the filters.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Form
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Rink
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Submitted By
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((submission) => (
                <tr key={submission.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {submission.templateName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {submission.rinkName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {submission.submittedByName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDate(submission.submittedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                        STATUS_COLORS[submission.status as SubmissionStatus]
                      }`}
                    >
                      {submission.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/submissions/${submission.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Review
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
