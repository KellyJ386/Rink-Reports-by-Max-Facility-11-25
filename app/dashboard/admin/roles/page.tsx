'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Role {
  id: string
  name: string
  description: string | null
  isSystemDefault: boolean
  permissions: Record<string, unknown>
  _count: {
    users: number
  }
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles')
      if (!res.ok) throw new Error('Failed to fetch roles')
      const data = await res.json()
      setRoles(data.roles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the "${roleName}" role?`)) {
      return
    }

    try {
      const res = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete role')
      }

      fetchRoles()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Role Management</h1>
          <p className="text-gray-600 mt-1">
            Configure roles and their permissions
          </p>
        </div>
        <Link href="/dashboard/admin/roles/new" className="btn btn-primary">
          + Create Role
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {roles.map((role) => (
          <div key={role.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                  {role.isSystemDefault && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      System Default
                    </span>
                  )}
                </div>
                {role.description && (
                  <p className="text-gray-600 mt-1">{role.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {role._count.users} user{role._count.users !== 1 ? 's' : ''} assigned
                </p>
              </div>
              <div className="flex gap-2">
                {!role.isSystemDefault && (
                  <>
                    <Link
                      href={`/dashboard/admin/roles/${role.id}`}
                      className="btn btn-secondary text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(role.id, role.name)}
                      disabled={role._count.users > 0}
                      className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title={role._count.users > 0 ? 'Cannot delete role with assigned users' : ''}
                    >
                      Delete
                    </button>
                  </>
                )}
                {role.isSystemDefault && (
                  <Link
                    href={`/dashboard/admin/roles/${role.id}`}
                    className="btn btn-secondary text-sm"
                  >
                    View Permissions
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
