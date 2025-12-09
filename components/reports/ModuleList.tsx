'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Submission {
  id: string
  status: string
  submittedAt: string
  facility?: { name: string }
  rink?: { name: string }
  submittedBy?: { firstName: string; lastName: string }
  data: Record<string, unknown>
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface ModuleListProps {
  moduleType: string
  title: string
  description: string
  basePath: string
  columns: {
    key: string
    label: string
    render?: (submission: Submission) => React.ReactNode
  }[]
  emptyIcon?: React.ReactNode
  emptyTitle?: string
  emptyDescription?: string
}

const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700' },
  SUBMITTED: { label: 'Submitted', color: 'bg-blue-100 text-blue-700' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-yellow-100 text-yellow-700' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-700' },
}

export function ModuleList({
  moduleType,
  title,
  description,
  basePath,
  columns,
  emptyIcon,
  emptyTitle = 'No submissions yet',
  emptyDescription = 'Get started by creating your first submission',
}: ModuleListProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  })
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
  })

  useEffect(() => {
    fetchSubmissions()
  }, [pagination.page, filters, moduleType])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        moduleType,
        page: String(pagination.page),
        limit: String(pagination.limit),
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
      })

      const response = await fetch(`/api/submissions?${params}`)
      const data = await response.json()

      if (data.success) {
        setSubmissions(data.data)
        setPagination(data.pagination)
      } else {
        setError(data.error?.message || 'Failed to load submissions')
      }
    } catch {
      setError('Failed to load submissions')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-500 mt-1">{description}</p>
        </div>
        <Link href={`${basePath}/new`} className="btn btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New {title.replace(/s$/, '')}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input w-full"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input w-full"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', startDate: '', endDate: '' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchSubmissions} className="btn btn-secondary mt-4">
            Try Again
          </button>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          {emptyIcon || (
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          <h3 className="text-lg font-medium text-gray-900 mt-4">{emptyTitle}</h3>
          <p className="text-gray-500 mt-1">{emptyDescription}</p>
          <Link href={`${basePath}/new`} className="btn btn-primary mt-4">
            Create First Entry
          </Link>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facility / Rink
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => {
                  const status = statusConfig[submission.status] || statusConfig.DRAFT
                  return (
                    <tr key={submission.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(submission.submittedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {submission.facility?.name || '-'}
                        </div>
                        {submission.rink && (
                          <div className="text-sm text-gray-500">{submission.rink.name}</div>
                        )}
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm">
                          {col.render
                            ? col.render(submission)
                            : String(submission.data?.[col.key] || '-')}
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {submission.submittedBy?.firstName} {submission.submittedBy?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <Link
                          href={`${basePath}/${submission.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border px-4 py-3">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
