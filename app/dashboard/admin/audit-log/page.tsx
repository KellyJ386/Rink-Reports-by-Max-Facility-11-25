'use client'

import { useState, useEffect } from 'react'

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  previousValue: any
  newValue: any
  ipAddress: string | null
  createdAt: string
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-800',
  UPDATE: 'bg-blue-100 text-blue-800',
  DELETE: 'bg-red-100 text-red-800',
  ARCHIVE: 'bg-gray-100 text-gray-800',
  APPROVE: 'bg-purple-100 text-purple-800',
  REJECT: 'bg-orange-100 text-orange-800',
  LOGIN: 'bg-cyan-100 text-cyan-800',
  LOGOUT: 'bg-slate-100 text-slate-800',
}

const ENTITY_LABELS: Record<string, string> = {
  User: 'User',
  Role: 'Role',
  FormTemplate: 'Form Template',
  Submission: 'Submission',
  Rink: 'Rink',
  IceDepthConfiguration: 'Ice Depth Config',
  FacilitySettings: 'Settings',
  ScheduleEntry: 'Schedule',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    action: '',
    entityType: '',
    userId: '',
  })
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  useEffect(() => {
    fetchLogs()
  }, [page, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.action && { action: filters.action }),
        ...(filters.entityType && { entityType: filters.entityType }),
        ...(filters.userId && { userId: filters.userId }),
      })

      const response = await fetch(`/api/audit-log?${params}`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setTotalPages(data.totalPages || 1)
      } else {
        setError('Failed to load audit logs')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const formatChanges = (prev: any, next: any) => {
    if (!prev && !next) return null

    const changes: { field: string; from: any; to: any }[] = []
    const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})])

    allKeys.forEach(key => {
      const fromVal = prev?.[key]
      const toVal = next?.[key]
      if (JSON.stringify(fromVal) !== JSON.stringify(toVal)) {
        changes.push({ field: key, from: fromVal, to: toVal })
      }
    })

    return changes
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Audit Log</h2>
        <p className="text-sm text-gray-500 mt-1">
          View all administrative actions and changes made in the system
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => {
                setFilters({ ...filters, action: e.target.value })
                setPage(1)
              }}
              className="input py-1.5"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="ARCHIVE">Archive</option>
              <option value="APPROVE">Approve</option>
              <option value="REJECT">Reject</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
            <select
              value={filters.entityType}
              onChange={(e) => {
                setFilters({ ...filters, entityType: e.target.value })
                setPage(1)
              }}
              className="input py-1.5"
            >
              <option value="">All Types</option>
              <option value="User">Users</option>
              <option value="Role">Roles</option>
              <option value="FormTemplate">Form Templates</option>
              <option value="Submission">Submissions</option>
              <option value="Rink">Rinks</option>
              <option value="FacilitySettings">Settings</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ action: '', entityType: '', userId: '' })
                setPage(1)
              }}
              className="btn btn-secondary py-1.5 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          <p>No audit log entries found</p>
        </div>
      ) : (
        <>
          {/* Log Table */}
          <div className="card overflow-hidden p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium text-gray-900">
                          {log.user.firstName} {log.user.lastName}
                        </div>
                        <div className="text-gray-500 text-xs">{log.user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-800'}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="text-gray-900">{ENTITY_LABELS[log.entityType] || log.entityType}</div>
                        <div className="text-gray-400 text-xs font-mono truncate max-w-32" title={log.entityId}>
                          {log.entityId.slice(0, 12)}...
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {(log.previousValue || log.newValue) ? (
                          <button
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            {expandedLog === log.id ? 'Hide' : 'View'} Changes
                          </button>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                    {expandedLog === log.id && (log.previousValue || log.newValue) && (
                      <tr key={`${log.id}-details`}>
                        <td colSpan={5} className="px-4 py-4 bg-gray-50">
                          <div className="text-sm">
                            <h4 className="font-medium text-gray-700 mb-2">Changes:</h4>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div className="font-medium text-gray-500">Field</div>
                              <div className="font-medium text-gray-500">Previous</div>
                              <div className="font-medium text-gray-500">New</div>
                              {formatChanges(log.previousValue, log.newValue)?.map((change, idx) => (
                                <>
                                  <div key={`${idx}-field`} className="font-mono text-gray-700">{change.field}</div>
                                  <div key={`${idx}-from`} className="text-red-600 truncate" title={JSON.stringify(change.from)}>
                                    {change.from === undefined ? '-' : JSON.stringify(change.from)}
                                  </div>
                                  <div key={`${idx}-to`} className="text-green-600 truncate" title={JSON.stringify(change.to)}>
                                    {change.to === undefined ? '-' : JSON.stringify(change.to)}
                                  </div>
                                </>
                              ))}
                            </div>
                            {log.ipAddress && (
                              <div className="mt-3 text-xs text-gray-400">
                                IP: {log.ipAddress}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="btn btn-secondary py-1.5 text-sm disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="btn btn-secondary py-1.5 text-sm disabled:opacity-50"
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
