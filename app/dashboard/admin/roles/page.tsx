'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Role {
  id: string
  name: string
  description: string | null
  isSystemDefault: boolean
  permissions: any
  _count: { users: number }
}

export default function RolesPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [canEdit, setCanEdit] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'system' | 'custom'>('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [rolesRes, meRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/auth/me'),
      ])

      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()
      if (!meData.user?.role?.permissions?.admin?.access) {
        router.push('/dashboard')
        return
      }
      setCanEdit(meData.user?.role?.permissions?.admin?.edit || false)

      if (rolesRes.ok) {
        const rolesData = await rolesRes.json()
        setRoles(rolesData.roles || [])
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter roles based on search and filters
  const filteredRoles = roles.filter((role) => {
    const matchesSearch =
      !search ||
      role.name.toLowerCase().includes(search.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(search.toLowerCase()))

    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'system' && role.isSystemDefault) ||
      (typeFilter === 'custom' && !role.isSystemDefault)

    return matchesSearch && matchesType
  })

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage access levels and permissions for your team
          </p>
        </div>
        {canEdit && (
          <Link href="/dashboard/admin/roles/new" className="btn btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Role
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input w-full"
            />
          </div>
          <div className="w-40">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'system' | 'custom')}
              className="input w-full"
            >
              <option value="all">All Types</option>
              <option value="system">System Default</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          {(search || typeFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('')
                setTypeFilter('all')
              }}
              className="btn btn-secondary text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {filteredRoles.length === 0 ? (
        <div className="card text-center py-8 text-gray-500">
          {roles.length === 0 ? 'No roles found' : 'No roles match your filters'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredRoles.map((role) => {
            const permissions = role.permissions as any
            const moduleCount = Object.keys(permissions || {}).filter(
              (k) => permissions[k]?.access
            ).length

            return (
              <div key={role.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
                      {role.isSystemDefault && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                          System Default
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-gray-600 text-sm mt-1">{role.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>{role._count.users} user{role._count.users !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{moduleCount} module{moduleCount !== 1 ? 's' : ''} accessible</span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/admin/roles/${role.id}`}
                    className="btn btn-secondary text-sm"
                  >
                    {canEdit && !role.isSystemDefault ? 'Edit' : 'View'}
                  </Link>
                </div>

                {/* Permission Summary */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(permissions || {}).map(([module, perms]: [string, any]) => {
                      if (!perms?.access) return null
                      const permCount = Object.values(perms).filter(Boolean).length - 1
                      return (
                        <span
                          key={module}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          title={`${permCount} permissions enabled`}
                        >
                          {module.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
