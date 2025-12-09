'use client'

import { useState, useEffect } from 'react'
import type { FormSchema } from './types'

interface FormVersion {
  id: string
  version: number
  schema: FormSchema
  createdAt: string
  createdBy?: {
    id: string
    name: string
  }
  changes?: string
}

interface FormVersioningProps {
  templateId: string
  currentVersion: number
  onRestoreVersion?: (schema: FormSchema) => void
}

export function FormVersioning({
  templateId,
  currentVersion,
  onRestoreVersion,
}: FormVersioningProps) {
  const [versions, setVersions] = useState<FormVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<FormVersion | null>(null)
  const [compareVersion, setCompareVersion] = useState<FormVersion | null>(null)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    fetchVersions()
  }, [templateId])

  const fetchVersions = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/form-templates/${templateId}/versions`)
      const data = await response.json()

      if (data.success) {
        setVersions(data.data)
      } else {
        setError(data.error?.message || 'Failed to load versions')
      }
    } catch {
      setError('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (version: FormVersion) => {
    if (!onRestoreVersion) return

    if (
      !confirm(
        `Are you sure you want to restore version ${version.version}? This will replace your current form configuration.`
      )
    ) {
      return
    }

    onRestoreVersion(version.schema)
  }

  const getVersionDiff = (v1: FormSchema, v2: FormSchema): VersionDiff => {
    const v1Fields = getAllFieldIds(v1)
    const v2Fields = getAllFieldIds(v2)

    const added = v2Fields.filter((id) => !v1Fields.includes(id))
    const removed = v1Fields.filter((id) => !v2Fields.includes(id))
    const modified = v1Fields.filter((id) => {
      if (!v2Fields.includes(id)) return false
      const f1 = getFieldById(v1, id)
      const f2 = getFieldById(v2, id)
      return JSON.stringify(f1) !== JSON.stringify(f2)
    })

    return { added, removed, modified }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="space-y-2">
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
            <div className="h-12 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-red-600 text-sm">{error}</div>
        <button
          onClick={fetchVersions}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Version History</h3>
          <span className="text-sm text-gray-500">
            Current: v{currentVersion}
          </span>
        </div>
      </div>

      {versions.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <HistoryIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
          <p>No version history available</p>
          <p className="text-xs mt-1">
            Versions are created when you save changes
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className={`p-4 hover:bg-gray-50 transition-colors ${
                selectedVersion?.id === version.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      version.version === currentVersion
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    v{version.version}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        Version {version.version}
                      </span>
                      {version.version === currentVersion && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(version.createdAt).toLocaleString()}
                    </p>
                    {version.createdBy && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        by {version.createdBy.name}
                      </p>
                    )}
                    {version.changes && (
                      <p className="text-sm text-gray-600 mt-1">
                        {version.changes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSelectedVersion(
                        selectedVersion?.id === version.id ? null : version
                      )
                    }
                    className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1"
                  >
                    {selectedVersion?.id === version.id ? 'Hide' : 'View'}
                  </button>
                  {version.version !== currentVersion && onRestoreVersion && (
                    <button
                      onClick={() => handleRestore(version)}
                      className="text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                    >
                      Restore
                    </button>
                  )}
                  {index < versions.length - 1 && (
                    <button
                      onClick={() => {
                        setCompareVersion(version)
                        setSelectedVersion(versions[index + 1])
                        setShowComparison(true)
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
                    >
                      Compare
                    </button>
                  )}
                </div>
              </div>

              {/* Version details */}
              {selectedVersion?.id === version.id && (
                <div className="mt-4 pl-11">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">
                      Schema Summary
                    </h4>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Sections:</span>{' '}
                        <span className="font-medium">
                          {version.schema.sections.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Fields:</span>{' '}
                        <span className="font-medium">
                          {countFields(version.schema)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Required:</span>{' '}
                        <span className="font-medium">
                          {countRequiredFields(version.schema)}
                        </span>
                      </div>
                    </div>

                    {/* Field types breakdown */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-500 mb-2">
                        Field Types
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(getFieldTypeCounts(version.schema)).map(
                          ([type, count]) => (
                            <span
                              key={type}
                              className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded"
                            >
                              {type}: {count}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Comparison Modal */}
      {showComparison && selectedVersion && compareVersion && (
        <VersionComparisonModal
          version1={selectedVersion}
          version2={compareVersion}
          onClose={() => {
            setShowComparison(false)
            setCompareVersion(null)
          }}
        />
      )}
    </div>
  )
}

interface VersionDiff {
  added: string[]
  removed: string[]
  modified: string[]
}

function VersionComparisonModal({
  version1,
  version2,
  onClose,
}: {
  version1: FormVersion
  version2: FormVersion
  onClose: () => void
}) {
  const diff = getVersionDiff(version1.schema, version2.schema)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            Compare v{version1.version} → v{version2.version}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">
                {diff.added.length}
              </div>
              <div className="text-sm text-green-700">Added</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">
                {diff.removed.length}
              </div>
              <div className="text-sm text-red-700">Removed</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {diff.modified.length}
              </div>
              <div className="text-sm text-yellow-700">Modified</div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            {diff.added.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">
                  Added Fields
                </h4>
                <div className="space-y-1">
                  {diff.added.map((id) => {
                    const field = getFieldById(version2.schema, id)
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 text-sm bg-green-50 p-2 rounded"
                      >
                        <span className="text-green-600">+</span>
                        <span>{field?.label || id}</span>
                        <span className="text-gray-400 text-xs">
                          ({field?.type})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {diff.removed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-red-700 mb-2">
                  Removed Fields
                </h4>
                <div className="space-y-1">
                  {diff.removed.map((id) => {
                    const field = getFieldById(version1.schema, id)
                    return (
                      <div
                        key={id}
                        className="flex items-center gap-2 text-sm bg-red-50 p-2 rounded"
                      >
                        <span className="text-red-600">-</span>
                        <span>{field?.label || id}</span>
                        <span className="text-gray-400 text-xs">
                          ({field?.type})
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {diff.modified.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-yellow-700 mb-2">
                  Modified Fields
                </h4>
                <div className="space-y-1">
                  {diff.modified.map((id) => {
                    const oldField = getFieldById(version1.schema, id)
                    const newField = getFieldById(version2.schema, id)
                    return (
                      <div
                        key={id}
                        className="text-sm bg-yellow-50 p-2 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-600">~</span>
                          <span>{newField?.label || id}</span>
                        </div>
                        <div className="ml-4 mt-1 text-xs text-gray-500">
                          {getFieldChanges(oldField, newField)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {diff.added.length === 0 &&
              diff.removed.length === 0 &&
              diff.modified.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  No differences found
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getAllFieldIds(schema: FormSchema): string[] {
  return schema.sections.flatMap((s) => s.fields.map((f) => f.id))
}

function getFieldById(schema: FormSchema, id: string) {
  for (const section of schema.sections) {
    const field = section.fields.find((f) => f.id === id)
    if (field) return field
  }
  return null
}

function countFields(schema: FormSchema): number {
  return schema.sections.reduce((acc, s) => acc + s.fields.length, 0)
}

function countRequiredFields(schema: FormSchema): number {
  return schema.sections.reduce(
    (acc, s) => acc + s.fields.filter((f) => f.required).length,
    0
  )
}

function getFieldTypeCounts(schema: FormSchema): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const section of schema.sections) {
    for (const field of section.fields) {
      counts[field.type] = (counts[field.type] || 0) + 1
    }
  }
  return counts
}

function getFieldChanges(oldField: unknown, newField: unknown): string {
  if (!oldField || !newField) return 'Field data unavailable'

  const changes: string[] = []
  const old = oldField as Record<string, unknown>
  const current = newField as Record<string, unknown>

  if (old.label !== current.label) {
    changes.push(`Label: "${old.label}" → "${current.label}"`)
  }
  if (old.required !== current.required) {
    changes.push(`Required: ${old.required ? 'Yes' : 'No'} → ${current.required ? 'Yes' : 'No'}`)
  }
  if (old.type !== current.type) {
    changes.push(`Type: ${old.type} → ${current.type}`)
  }
  if (JSON.stringify(old.validation) !== JSON.stringify(current.validation)) {
    changes.push('Validation rules changed')
  }
  if (JSON.stringify(old.options) !== JSON.stringify(current.options)) {
    changes.push('Options changed')
  }

  return changes.length > 0 ? changes.join(', ') : 'Configuration changed'
}

function getVersionDiff(v1: FormSchema, v2: FormSchema): VersionDiff {
  const v1Fields = getAllFieldIds(v1)
  const v2Fields = getAllFieldIds(v2)

  const added = v2Fields.filter((id) => !v1Fields.includes(id))
  const removed = v1Fields.filter((id) => !v2Fields.includes(id))
  const modified = v1Fields.filter((id) => {
    if (!v2Fields.includes(id)) return false
    const f1 = getFieldById(v1, id)
    const f2 = getFieldById(v2, id)
    return JSON.stringify(f1) !== JSON.stringify(f2)
  })

  return { added, removed, modified }
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
}
