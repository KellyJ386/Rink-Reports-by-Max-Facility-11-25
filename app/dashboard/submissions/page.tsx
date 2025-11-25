'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface Submission {
  id: string
  formTemplate: {
    id: string
    name: string
    moduleType: string
  }
  rink: {
    id: string
    name: string
  }
  submittedBy: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  submittedAt: string
  status: string
  outsideTemp: number | null
  outsideTempUnit: string
}

interface SubmissionsResponse {
  submissions: Submission[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

const moduleTypeLabels: Record<string, string> = {
  ICE_OPERATIONS: 'Ice Operations',
  ICE_DEPTH: 'Ice Depth',
  REFRIGERATION: 'Refrigeration',
  AIR_QUALITY: 'Air Quality',
  INCIDENT: 'Incident',
  SCHEDULE: 'Schedule',
  DAILY_CHECKLIST: 'Daily Checklist',
}

const statusColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'default',
  SUBMITTED: 'primary',
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
}

export default function SubmissionsPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })

  // Filters
  const [moduleType, setModuleType] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [status, setStatus] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    fetchSubmissions()
  }, [pagination.offset, moduleType, startDate, endDate, status])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      })

      if (moduleType) params.append('moduleType', moduleType)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (status) params.append('status', status)

      const response = await fetch(`/api/submissions?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }

      const data: SubmissionsResponse = await response.json()
      setSubmissions(data.submissions)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching submissions:', error)
      alert('Error loading submissions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClearFilters = () => {
    setModuleType('')
    setStartDate('')
    setEndDate('')
    setStatus('')
    setSearchTerm('')
    setPagination((prev) => ({ ...prev, offset: 0 }))
  }

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }))
    }
  }

  const handlePrevPage = () => {
    setPagination((prev) => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit),
    }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const filteredSubmissions = submissions.filter((submission) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      submission.formTemplate.name.toLowerCase().includes(search) ||
      submission.rink.name.toLowerCase().includes(search) ||
      `${submission.submittedBy.firstName} ${submission.submittedBy.lastName}`
        .toLowerCase()
        .includes(search)
    )
  })

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Submissions</h1>
          <p className="text-wolf-600 mt-1">
            View and manage all form submissions
          </p>
        </div>
        <div className="text-sm text-wolf-600">
          {pagination.total} total submission{pagination.total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy-900">Filters</h2>
            {(moduleType || startDate || endDate || status) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Search
              </label>
              <Input
                type="text"
                placeholder="Form, rink, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Module Type */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Module
              </label>
              <select
                className="w-full px-3 py-2 border border-wolf-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-green-500"
                value={moduleType}
                onChange={(e) => {
                  setModuleType(e.target.value)
                  setPagination((prev) => ({ ...prev, offset: 0 }))
                }}
              >
                <option value="">All Modules</option>
                {Object.entries(moduleTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPagination((prev) => ({ ...prev, offset: 0 }))
                }}
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPagination((prev) => ({ ...prev, offset: 0 }))
                }}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-wolf-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-action-green-500"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPagination((prev) => ({ ...prev, offset: 0 }))
                }}
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Submissions Table */}
      <Card>
        {loading ? (
          <div className="p-12 text-center text-wolf-600">
            Loading submissions...
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-wolf-400 text-5xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-navy-900 mb-2">
              No submissions found
            </h3>
            <p className="text-wolf-600">
              {searchTerm || moduleType || startDate || endDate || status
                ? 'Try adjusting your filters'
                : 'Submit your first form to see it here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-wolf-50 border-b border-wolf-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Form
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Rink
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Submitted By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-navy-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-wolf-200">
                {filteredSubmissions.map((submission) => (
                  <tr
                    key={submission.id}
                    className="hover:bg-wolf-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/submissions/${submission.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-navy-900">
                        {submission.formTemplate.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-wolf-600">
                        {moduleTypeLabels[submission.formTemplate.moduleType] ||
                          submission.formTemplate.moduleType}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-wolf-600">
                        {submission.rink.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-wolf-900">
                        {submission.submittedBy.firstName}{' '}
                        {submission.submittedBy.lastName}
                      </div>
                      <div className="text-xs text-wolf-500">
                        {submission.submittedBy.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-wolf-600">
                        {formatDate(submission.submittedAt)}
                      </div>
                      {submission.outsideTemp !== null && (
                        <div className="text-xs text-wolf-500">
                          {submission.outsideTemp}°{submission.outsideTempUnit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={statusColors[submission.status]}>
                        {submission.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/dashboard/submissions/${submission.id}`)
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredSubmissions.length > 0 && (
          <div className="px-6 py-4 border-t border-wolf-200 flex items-center justify-between">
            <div className="text-sm text-wolf-600">
              Showing {pagination.offset + 1} to{' '}
              {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
              {pagination.total} results
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={pagination.offset === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
