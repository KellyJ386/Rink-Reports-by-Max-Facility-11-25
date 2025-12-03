'use client'

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

interface AdminPermissions {
  access: boolean
  editUsers?: boolean
  editForms?: boolean
  editSettings?: boolean
}

interface PermissionSet {
  admin: AdminPermissions
  iceDepth: ModulePermissions
  iceOperations: ModulePermissions
  refrigeration: ModulePermissions
  airQuality: ModulePermissions
  incidents: ModulePermissions
  schedule: ModulePermissions
  dailyChecklist: ModulePermissions
}

interface PermissionMatrixProps {
  permissions: PermissionSet
  onChange: (permissions: PermissionSet) => void
  readOnly?: boolean
}

const MODULES: { key: keyof PermissionSet; label: string; permissions: string[] }[] = [
  {
    key: 'admin',
    label: 'Admin',
    permissions: ['access', 'editUsers', 'editForms', 'editSettings'],
  },
  {
    key: 'iceDepth',
    label: 'Ice Depth',
    permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export'],
  },
  {
    key: 'iceOperations',
    label: 'Ice Operations',
    permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export'],
  },
  {
    key: 'refrigeration',
    label: 'Refrigeration',
    permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export'],
  },
  {
    key: 'airQuality',
    label: 'Air Quality',
    permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export'],
  },
  {
    key: 'incidents',
    label: 'Incidents',
    permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export', 'approve'],
  },
  {
    key: 'schedule',
    label: 'Schedule',
    permissions: ['access', 'viewOwn', 'viewAll', 'create', 'edit', 'delete', 'publish'],
  },
  {
    key: 'dailyChecklist',
    label: 'Daily Checklist',
    permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export', 'createTemplates'],
  },
]

const ALL_PERMISSIONS = [
  'access',
  'submit',
  'viewOwn',
  'viewAll',
  'edit',
  'delete',
  'export',
  'approve',
  'createTemplates',
  'create',
  'publish',
  'editUsers',
  'editForms',
  'editSettings',
]

const PERMISSION_LABELS: Record<string, string> = {
  access: 'Access',
  submit: 'Submit',
  viewOwn: 'View Own',
  viewAll: 'View All',
  edit: 'Edit',
  delete: 'Delete',
  export: 'Export',
  approve: 'Approve',
  createTemplates: 'Create Templates',
  create: 'Create',
  publish: 'Publish',
  editUsers: 'Edit Users',
  editForms: 'Edit Forms',
  editSettings: 'Edit Settings',
}

export default function PermissionMatrix({
  permissions,
  onChange,
  readOnly = false,
}: PermissionMatrixProps) {
  const handleToggle = (moduleKey: keyof PermissionSet, permission: string) => {
    if (readOnly) return

    const modulePerms = permissions[moduleKey] as Record<string, boolean>
    const currentValue = modulePerms[permission] ?? false

    // If toggling off "access", turn off all other permissions for this module
    if (permission === 'access' && currentValue) {
      const newModulePerms: Record<string, boolean> = { access: false }
      Object.keys(modulePerms).forEach((key) => {
        if (key !== 'access') {
          newModulePerms[key] = false
        }
      })
      onChange({
        ...permissions,
        [moduleKey]: newModulePerms,
      })
      return
    }

    // If toggling on any permission and access is off, turn on access too
    if (permission !== 'access' && !currentValue && !modulePerms.access) {
      onChange({
        ...permissions,
        [moduleKey]: {
          ...modulePerms,
          access: true,
          [permission]: true,
        },
      })
      return
    }

    onChange({
      ...permissions,
      [moduleKey]: {
        ...modulePerms,
        [permission]: !currentValue,
      },
    })
  }

  const toggleAllForModule = (moduleKey: keyof PermissionSet) => {
    if (readOnly) return

    const moduleConfig = MODULES.find((m) => m.key === moduleKey)
    if (!moduleConfig) return

    const modulePerms = permissions[moduleKey] as Record<string, boolean>
    const allEnabled = moduleConfig.permissions.every((p) => modulePerms[p])

    const newModulePerms: Record<string, boolean> = {}
    moduleConfig.permissions.forEach((p) => {
      newModulePerms[p] = !allEnabled
    })

    onChange({
      ...permissions,
      [moduleKey]: newModulePerms,
    })
  }

  // Get unique permissions used across all modules
  const usedPermissions = Array.from(
    new Set(MODULES.flatMap((m) => m.permissions))
  ).sort((a, b) => ALL_PERMISSIONS.indexOf(a) - ALL_PERMISSIONS.indexOf(b))

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Module
              </th>
              {usedPermissions.map((perm) => (
                <th
                  key={perm}
                  className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                >
                  {PERMISSION_LABELS[perm] || perm}
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                All
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {MODULES.map((module) => {
              const modulePerms = permissions[module.key] as Record<string, boolean>
              const allEnabled = module.permissions.every((p) => modulePerms[p])

              return (
                <tr key={module.key} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                    {module.label}
                  </td>
                  {usedPermissions.map((perm) => {
                    const isApplicable = module.permissions.includes(perm)
                    const isEnabled = isApplicable && modulePerms[perm]

                    return (
                      <td key={perm} className="px-3 py-3 text-center">
                        {isApplicable ? (
                          <button
                            type="button"
                            onClick={() => handleToggle(module.key, perm)}
                            disabled={readOnly}
                            className={`w-5 h-5 rounded border-2 transition-colors ${
                              isEnabled
                                ? 'bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 hover:border-blue-400'
                            } ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            {isEnabled && (
                              <svg
                                className="w-full h-full"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    )
                  })}
                  <td className="px-3 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => toggleAllForModule(module.key)}
                      disabled={readOnly}
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        allEnabled
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } ${readOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                      {allEnabled ? 'Clear' : 'All'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
        <p>
          <strong>Tip:</strong> Click &quot;All&quot; to toggle all permissions for a module.
          Disabling &quot;Access&quot; will disable all other permissions for that module.
        </p>
      </div>
    </div>
  )
}
