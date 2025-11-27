'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Role {
  id: string
  name: string
  description: string | null
  isSystemDefault: boolean
  permissions: Record<string, Record<string, boolean>>
  _count: { users: number }
}

const MODULES = [
  { key: 'admin', label: 'Admin', permissions: ['access', 'edit', 'delete', 'createTemplates'], description: 'Manage users, roles, forms, and settings' },
  { key: 'iceDepth', label: 'Ice Depth', permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export'] },
  { key: 'iceOperations', label: 'Ice Operations', permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export'] },
  { key: 'refrigeration', label: 'Refrigeration', permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export'] },
  { key: 'airQuality', label: 'Air Quality', permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export'] },
  { key: 'incidents', label: 'Incidents', permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export', 'approve'] },
  { key: 'schedule', label: 'Schedule', permissions: ['access', 'viewOwn', 'viewAll', 'create', 'edit', 'delete', 'publish'] },
  { key: 'dailyChecklist', label: 'Daily Checklist', permissions: ['access', 'submit', 'viewOwn', 'viewAll', 'edit', 'delete', 'export', 'createTemplates'] },
]

const PERMISSION_LABELS: Record<string, string> = {
  access: 'Access Module',
  submit: 'Submit Reports',
  viewOwn: 'View Own',
  viewAll: 'View All',
  edit: 'Edit Users/Roles',
  delete: 'Delete',
  export: 'Export',
  approve: 'Approve',
  create: 'Create',
  publish: 'Publish',
  createTemplates: 'Manage Forms',
}

// Admin-specific permission labels
const ADMIN_PERMISSION_LABELS: Record<string, string> = {
  access: 'Access Admin Area',
  edit: 'Edit Users & Roles',
  delete: 'Delete Users & Roles',
  createTemplates: 'Manage Form Templates',
}

export default function RoleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const roleId = params.id as string
  const isNew = roleId === 'new'

  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    if (!isNew) {
      fetchRole()
    } else {
      // Initialize default permissions structure
      const defaultPerms: Record<string, Record<string, boolean>> = {}
      MODULES.forEach((mod) => {
        defaultPerms[mod.key] = {}
        mod.permissions.forEach((perm) => {
          defaultPerms[mod.key][perm] = false
        })
      })
      setPermissions(defaultPerms)
    }
  }, [roleId, isNew])

  const fetchRole = async () => {
    try {
      const response = await fetch(`/api/roles/${roleId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Role not found')
        return
      }

      const foundRole = data.role
      setRole(foundRole)
      setName(foundRole.name)
      setDescription(foundRole.description || '')
      setPermissions(foundRole.permissions || {})
    } catch (err) {
      setError('Failed to load role')
    } finally {
      setLoading(false)
    }
  }

  const handlePermissionChange = (module: string, permission: string, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [permission]: value,
        // If turning off access, turn off all other permissions
        ...(permission === 'access' && !value
          ? Object.fromEntries(MODULES.find((m) => m.key === module)?.permissions.map((p) => [p, false]) || [])
          : {}),
      },
    }))
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Role name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await fetch(isNew ? '/api/roles' : `/api/roles/${roleId}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, permissions }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save role')
      }

      router.push('/dashboard/admin/roles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!role) return

    if (role._count.users > 0) {
      setError(`Cannot delete role with ${role._count.users} assigned user(s). Reassign users first.`)
      return
    }

    if (!confirm(`Are you sure you want to delete "${role.name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(true)
    setError('')

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete role')
      }

      router.push('/dashboard/admin/roles')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete role')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  const isReadOnly = role?.isSystemDefault

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/admin/roles" className="text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {isNew ? 'Create Role' : isReadOnly ? 'View Role' : 'Edit Role'}
          </h2>
          {isReadOnly && (
            <p className="text-sm text-amber-600">System default roles cannot be modified</p>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-6">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Role Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="e.g., Lead Operator"
                disabled={isReadOnly}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                rows={2}
                placeholder="Brief description of this role"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </div>

        {/* Permissions Grid */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Module Permissions</h3>
          <div className="space-y-6">
            {MODULES.map((mod) => {
              const modulePerms = permissions[mod.key] || {}
              const hasAccess = modulePerms.access

              return (
                <div key={mod.key} className={`p-4 rounded-lg ${hasAccess ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-900">{mod.label}</span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={hasAccess || false}
                        onChange={(e) => handlePermissionChange(mod.key, 'access', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        disabled={isReadOnly}
                      />
                      <span className="text-sm text-gray-600">Enable Access</span>
                    </label>
                  </div>
                  {hasAccess && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {mod.permissions.filter((p) => p !== 'access').map((perm) => (
                        <label key={perm} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={modulePerms[perm] || false}
                            onChange={(e) => handlePermissionChange(mod.key, perm, e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            disabled={isReadOnly}
                          />
                          <span className="text-sm text-gray-600">
                            {mod.key === 'admin'
                              ? (ADMIN_PERMISSION_LABELS[perm] || perm)
                              : (PERMISSION_LABELS[perm] || perm)
                            }
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <div className="flex justify-between">
            {!isNew && (
              <button
                onClick={handleDelete}
                disabled={deleting || saving}
                className="btn btn-secondary text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Role'}
              </button>
            )}
            <div className={`flex gap-3 ${isNew ? 'ml-auto' : ''}`}>
              <Link href="/dashboard/admin/roles" className="btn btn-secondary">
                Cancel
              </Link>
              <button onClick={handleSave} disabled={saving || deleting} className="btn btn-primary">
                {saving ? 'Saving...' : isNew ? 'Create Role' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
