'use client'

import { useState, useEffect } from 'react'

interface Version {
  id: string
  version: number
  name: string
  createdAt: string
  updatedAt: string
  isActive: boolean
  isCurrent: boolean
}

interface VersionHistoryProps {
  templateId: string
  currentVersion: number
  onVersionSelect: (versionId: string) => void
  onCreateVersion: () => void
}

export default function VersionHistory({
  templateId,
  currentVersion,
  onVersionSelect,
  onCreateVersion,
}: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [templateId])

  const fetchVersions = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/form-templates/${templateId}/versions`)
      if (!response.ok) {
        throw new Error('Failed to fetch versions')
      }
      const data = await response.json()
      setVersions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
          <span className="text-sm">Loading versions...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={fetchVersions}
          className="text-sm text-red-700 underline mt-1"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">v{currentVersion}</span>
          <span className="text-sm text-gray-500">
            ({versions.length} version{versions.length !== 1 ? 's' : ''})
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Version List */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Create New Version Button */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={onCreateVersion}
              className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Save as New Version
            </button>
          </div>

          {/* Version Items */}
          <div className="max-h-64 overflow-y-auto">
            {versions.map((version) => (
              <div
                key={version.id}
                className={`px-4 py-3 border-b border-gray-100 last:border-b-0 ${
                  version.isCurrent
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50 cursor-pointer'
                }`}
                onClick={() => !version.isCurrent && onVersionSelect(version.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">v{version.version}</span>
                    {version.isCurrent && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        Current
                      </span>
                    )}
                    {version.isActive && !version.isCurrent && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                        Active
                      </span>
                    )}
                    {!version.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        Archived
                      </span>
                    )}
                  </div>
                  {!version.isCurrent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onVersionSelect(version.id)
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDate(version.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
