'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const MODULES = [
  { key: 'iceDepth', label: 'Ice Depth' },
  { key: 'iceOperations', label: 'Ice Operations' },
  { key: 'refrigeration', label: 'Refrigeration' },
  { key: 'airQuality', label: 'Air Quality' },
  { key: 'incidents', label: 'Incidents' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'dailyChecklist', label: 'Daily Checklist' },
]

const PERMISSIONS = [
  { key: 'viewOwn', label: 'View Own' },
  { key: 'viewAll', label: 'View All' },
  { key: 'submit', label: 'Submit' },
  { key: 'edit', label: 'Edit' },
  { key: 'approve', label: 'Approve' },
  { key: 'delete', label: 'Delete' },
]

const ADMIN_PERMISSIONS = [
  { key: 'manageUsers', label: 'Manage Users' },
  { key: 'manageRoles', label: 'Manage Roles' },
  { key: 'manageSettings', label: 'Manage Settings' },
  { key: 'manageForms', label: 'Manage Forms' },
]

export default function NewRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>(() => {
    const initial: Record<string, Record<string, boolean>> = { admin: {} }
    MODULES.forEach((mod) => {
      initial[mod.key] = { access: false }
      PERMISSIONS.forEach((perm) => {
        initial[mod.key][perm.key] = false
      })
    })
    ADMIN_PERMISSIONS.forEach((perm) => {
      initial.admin[perm.key] = false
    })
    return initial
  })

  const toggleModuleAccess = (moduleKey: string) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        access: !prev[moduleKey].access,
      },
    }))
  }

  const togglePermission = (moduleKey: string, permKey: string) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: {
        ...prev[moduleKey],
        [permKey]: !prev[moduleKey][permKey],
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          permissions,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create role')
      }

      router.push('/dashboard/admin/roles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/dashboard/admin/roles"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Role</h1>
          <p className="text-gray-600 mt-1">Define role permissions</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full max-w-md"
                placeholder="e.g., Senior Operator"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input w-full max-w-md"
                rows={2}
                placeholder="Brief description of this role..."
              />
            </div>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Module Permissions</h2>
          <div className="space-y-4">
            {MODULES.map((module) => (
              <div key={module.key} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={permissions[module.key].access}
                      onChange={() => toggleModuleAccess(module.key)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="font-medium text-gray-900">{module.label}</span>
                  </label>
                </div>
                {permissions[module.key].access && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-3 border-t">
                    {PERMISSIONS.map((perm) => (
                      <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={permissions[module.key][perm.key]}
                          onChange={() => togglePermission(module.key, perm.key)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-600">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Permissions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ADMIN_PERMISSIONS.map((perm) => (
              <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={permissions.admin[perm.key]}
                  onChange={() => togglePermission('admin', perm.key)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-gray-700">{perm.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/admin/roles" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </form>
    </div>
  )
}
