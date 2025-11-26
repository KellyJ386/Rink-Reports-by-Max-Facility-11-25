'use client'

import { useState, useEffect } from 'react'

interface Role {
  id: string
  name: string
  description: string | null
  isSystemDefault: boolean
  permissions: any
}

const MODULE_LIST = [
  { key: 'iceDepth', label: 'Ice Depth' },
  { key: 'iceOperations', label: 'Ice Operations' },
  { key: 'refrigeration', label: 'Refrigeration' },
  { key: 'airQuality', label: 'Air Quality' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'dailyChecklist', label: 'Daily Checklist' },
  { key: 'admin', label: 'Admin' },
]

const PERMISSION_TYPES = [
  { key: 'access', label: 'Access' },
  { key: 'submit', label: 'Submit' },
  { key: 'viewAll', label: 'View All' },
  { key: 'edit', label: 'Edit' },
  { key: 'export', label: 'Export' },
]

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchRoles()
  }, [])

  async function fetchRoles() {
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (err) {
      setError('Failed to load roles')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRole = async (roleData: { name: string; description: string; permissions: any }) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleData),
      })

      if (!response.ok) {
        throw new Error('Failed to create role')
      }

      const newRole = await response.json()
      setRoles((prev) => [...prev, newRole])
      setShowAddModal(false)
    } catch (err) {
      setError('Failed to create role')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading roles...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
            <p className="text-gray-500">Configure roles and permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Role
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {roles.map((role) => (
          <div
            key={role.id}
            onClick={() => setSelectedRole(role)}
            className={`bg-white rounded-xl shadow-sm border-2 p-4 cursor-pointer transition-all ${
              selectedRole?.id === role.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{role.name}</h3>
              {role.isSystemDefault && (
                <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                  System
                </span>
              )}
            </div>
            {role.description && (
              <p className="text-sm text-gray-500 mb-3">{role.description}</p>
            )}
            <div className="flex flex-wrap gap-1">
              {MODULE_LIST.filter((m) => role.permissions?.[m.key]?.access).map((module) => (
                <span
                  key={module.key}
                  className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded"
                >
                  {module.label}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Role Details */}
      {selectedRole && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedRole.name} - Permissions
            </h2>
            {selectedRole.isSystemDefault && (
              <span className="text-sm text-gray-500">System roles cannot be modified</span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Module</th>
                  {PERMISSION_TYPES.map((perm) => (
                    <th key={perm.key} className="px-4 py-2 text-center font-medium text-gray-500">
                      {perm.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MODULE_LIST.map((module) => (
                  <tr key={module.key} className="border-b border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{module.label}</td>
                    {PERMISSION_TYPES.map((perm) => (
                      <td key={perm.key} className="px-4 py-3 text-center">
                        {selectedRole.permissions?.[module.key]?.[perm.key] ? (
                          <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-300 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showAddModal && (
        <AddRoleModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleCreateRole}
        />
      )}
    </div>
  )
}

function AddRoleModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({})

  const togglePermission = (module: string, perm: string) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [perm]: !prev[module]?.[perm],
      },
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, description, permissions })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 my-8 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Senior Operator"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Module</th>
                    {PERMISSION_TYPES.slice(0, 4).map((perm) => (
                      <th key={perm.key} className="px-3 py-2 text-center font-medium text-gray-500 text-xs">
                        {perm.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULE_LIST.slice(0, -1).map((module) => (
                    <tr key={module.key} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-700">{module.label}</td>
                      {PERMISSION_TYPES.slice(0, 4).map((perm) => (
                        <td key={perm.key} className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={permissions[module.key]?.[perm.key] || false}
                            onChange={() => togglePermission(module.key, perm.key)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
            >
              Create Role
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
