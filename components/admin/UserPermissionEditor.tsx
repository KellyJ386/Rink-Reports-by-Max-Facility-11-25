'use client'

import { useState } from 'react'

interface ModulePermissions {
  access: boolean
  submit?: boolean
  viewOwn?: boolean
  viewAll?: boolean
  edit?: boolean
  delete?: boolean
  export?: boolean
  approve?: boolean
  createTemplates?: boolean
  create?: boolean
  publish?: boolean
}

interface PermissionOverrides {
  [module: string]: Partial<ModulePermissions>
}

interface UserPermissionEditorProps {
  basePermissions: Record<string, ModulePermissions>
  overrides: PermissionOverrides | null
  onChange: (overrides: PermissionOverrides | null) => void
}

const MODULES = [
  { key: 'iceDepth', label: 'Ice Depth' },
  { key: 'iceOperations', label: 'Ice Operations' },
  { key: 'refrigeration', label: 'Refrigeration' },
  { key: 'airQuality', label: 'Air Quality' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'dailyChecklist', label: 'Daily Checklist' },
]

const PERMISSIONS: { key: keyof ModulePermissions; label: string }[] = [
  { key: 'access', label: 'Access' },
  { key: 'submit', label: 'Submit' },
  { key: 'viewOwn', label: 'View Own' },
  { key: 'viewAll', label: 'View All' },
  { key: 'edit', label: 'Edit' },
  { key: 'delete', label: 'Delete' },
  { key: 'export', label: 'Export' },
  { key: 'approve', label: 'Approve' },
]

export default function UserPermissionEditor({
  basePermissions,
  overrides,
  onChange,
}: UserPermissionEditorProps) {
  const [localOverrides, setLocalOverrides] = useState<PermissionOverrides>(
    overrides || {}
  )

  const getEffectiveValue = (
    module: string,
    permission: keyof ModulePermissions
  ): boolean => {
    if (localOverrides[module]?.[permission] !== undefined) {
      return localOverrides[module][permission] as boolean
    }
    return basePermissions[module]?.[permission] ?? false
  }

  const isOverridden = (
    module: string,
    permission: keyof ModulePermissions
  ): boolean => {
    return localOverrides[module]?.[permission] !== undefined
  }

  const handleToggle = (
    module: string,
    permission: keyof ModulePermissions
  ) => {
    const currentValue = getEffectiveValue(module, permission)
    const baseValue = basePermissions[module]?.[permission] ?? false

    setLocalOverrides((prev) => {
      const newOverrides = { ...prev }

      if (!newOverrides[module]) {
        newOverrides[module] = {}
      }

      // If toggling to same value as base, remove the override
      if (!currentValue === baseValue) {
        delete newOverrides[module][permission]
        if (Object.keys(newOverrides[module]).length === 0) {
          delete newOverrides[module]
        }
      } else {
        newOverrides[module][permission] = !currentValue
      }

      // Call onChange with null if no overrides, otherwise with overrides
      const hasOverrides = Object.keys(newOverrides).length > 0
      onChange(hasOverrides ? newOverrides : null)

      return newOverrides
    })
  }

  const resetOverrides = () => {
    setLocalOverrides({})
    onChange(null)
  }

  const hasAnyOverrides = Object.keys(localOverrides).length > 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Permission Overrides</h3>
          <p className="text-sm text-gray-500 mt-1">
            Customize permissions for this user. Changes override the role&apos;s default permissions.
          </p>
        </div>
        {hasAnyOverrides && (
          <button
            type="button"
            onClick={resetOverrides}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Reset all overrides
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Module
              </th>
              {PERMISSIONS.map((perm) => (
                <th
                  key={perm.key}
                  className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {perm.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {MODULES.map((module) => (
              <tr key={module.key}>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {module.label}
                </td>
                {PERMISSIONS.map((perm) => {
                  const value = getEffectiveValue(module.key, perm.key)
                  const overridden = isOverridden(module.key, perm.key)
                  const baseValue = basePermissions[module.key]?.[perm.key]

                  return (
                    <td key={perm.key} className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggle(module.key, perm.key)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          value ? 'bg-blue-600' : 'bg-gray-200'
                        } ${overridden ? 'ring-2 ring-yellow-400' : ''}`}
                        title={
                          overridden
                            ? `Overridden (base: ${baseValue ? 'on' : 'off'})`
                            : 'Using role default'
                        }
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      {overridden && (
                        <span className="block text-xs text-yellow-600 mt-1">
                          Override
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-blue-600 rounded-full" />
          <span>Enabled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-gray-200 rounded-full" />
          <span>Disabled</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 bg-gray-200 rounded-full ring-2 ring-yellow-400" />
          <span>Overridden from role</span>
        </div>
      </div>
    </div>
  )
}
