'use client'

import { useState, useEffect } from 'react'

interface FormVersion {
  id: string
  version: number
  name: string
  createdAt: string
  createdBy?: string
  changes?: string
}

interface FormVersionHistoryProps {
  templateId: string
  currentVersion: number
  onRestore?: (versionId: string) => void
}

export default function FormVersionHistory({
  templateId,
  currentVersion,
  onRestore,
}: FormVersionHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [versions, setVersions] = useState<FormVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Mock version history - in production this would fetch from API
  useEffect(() => {
    if (isOpen && versions.length === 0) {
      setIsLoading(true)
      // Simulate API call
      setTimeout(() => {
        const mockVersions: FormVersion[] = []
        for (let i = currentVersion; i >= 1; i--) {
          mockVersions.push({
            id: `v${i}`,
            version: i,
            name: `Version ${i}`,
            createdAt: new Date(Date.now() - (currentVersion - i) * 86400000).toISOString(),
            changes: i === currentVersion ? 'Current version' : `Updated form fields`,
          })
        }
        setVersions(mockVersions)
        setIsLoading(false)
      }, 500)
    }
  }, [isOpen, currentVersion, versions.length])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <span>📋</span>
        <span>Version {currentVersion}</span>
        <span className="text-xs">▼</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Version History</h3>
              <p className="text-xs text-gray-500 mt-1">
                View and restore previous versions
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading versions...
                </div>
              ) : versions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No version history available
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 hover:bg-gray-50 ${
                        version.version === currentVersion ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            v{version.version}
                          </span>
                          {version.version === currentVersion && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              Current
                            </span>
                          )}
                        </div>
                        {version.version !== currentVersion && onRestore && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Restore to version ${version.version}? This will create a new version.`)) {
                                onRestore(version.id)
                                setIsOpen(false)
                              }
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(version.createdAt).toLocaleDateString()} at{' '}
                        {new Date(version.createdAt).toLocaleTimeString()}
                      </p>
                      {version.changes && (
                        <p className="text-xs text-gray-600 mt-1">
                          {version.changes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Versions are created automatically when you save changes
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
