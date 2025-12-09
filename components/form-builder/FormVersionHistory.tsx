'use client'

import { useState, useEffect } from 'react'

interface FormVersion {
  id: string
  name: string
  version: number
  isActive: boolean
  createdAt: string
  createdBy: string
  _count: {
    submissions: number
  }
}

interface FormVersionHistoryProps {
  formId: string
  onClose: () => void
  onSelectVersion?: (versionId: string) => void
}

export function FormVersionHistory({
  formId,
  onClose,
  onSelectVersion,
}: FormVersionHistoryProps) {
  const [versions, setVersions] = useState<FormVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentVersion, setCurrentVersion] = useState<FormVersion | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [formId])

  const fetchVersions = async () => {
    try {
      // Fetch the current form
      const currentRes = await fetch(`/api/forms/${formId}`)
      if (!currentRes.ok) throw new Error('Failed to fetch form')
      const currentData = await currentRes.json()
      setCurrentVersion(currentData.form)

      // Build version chain
      const versionChain: FormVersion[] = [currentData.form]
      let nextVersionId = currentData.form.previousVersionId

      // Walk back through version history
      while (nextVersionId) {
        const res = await fetch(`/api/forms/${nextVersionId}`)
        if (!res.ok) break
        const data = await res.json()
        versionChain.push(data.form)
        nextVersionId = data.form.previousVersionId
      }

      setVersions(versionChain)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No version history available</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Version items */}
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <div
                    key={version.id}
                    className={`relative pl-10 ${
                      index === 0 ? 'font-medium' : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-2.5 w-3 h-3 rounded-full border-2 ${
                        index === 0
                          ? 'bg-blue-600 border-blue-600'
                          : version.isActive
                          ? 'bg-green-500 border-green-500'
                          : 'bg-gray-300 border-gray-400'
                      }`}
                    />

                    {/* Version card */}
                    <div
                      className={`p-4 rounded-lg border ${
                        index === 0
                          ? 'border-blue-200 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      } ${onSelectVersion && index > 0 ? 'cursor-pointer' : ''}`}
                      onClick={() => onSelectVersion && index > 0 && onSelectVersion(version.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">v{version.version}</span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-600 text-white">
                              Current
                            </span>
                          )}
                          {!version.isActive && index !== 0 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                              Inactive
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {version._count.submissions} submissions
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Created {formatDate(version.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>New versions are created automatically when forms with submissions are edited</span>
          </div>
        </div>
      </div>
    </div>
  )
}
