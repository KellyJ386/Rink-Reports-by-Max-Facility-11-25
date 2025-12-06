'use client'

import { useState, useEffect, useCallback } from 'react'
import type { PermissionSet, ModuleType, ModulePermissions } from '@/types'

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  phoneVerified: boolean
  smsOptIn: boolean
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
  role: {
    id: string
    name: string
  }
}

interface RoleData {
  id: string
  name: string
  description: string | null
  permissions: PermissionSet
  isSystemDefault: boolean
  userCount: number
  createdAt: string
}

type TabType = 'users' | 'roles'

const MODULE_LABELS: Record<ModuleType, string> = {
  admin: 'Admin',
  iceDepth: 'Ice Depth',
  iceOperations: 'Ice Operations',
  refrigeration: 'Refrigeration',
  airQuality: 'Air Quality',
  incidents: 'Incidents',
  schedule: 'Schedule',
  dailyChecklist: 'Daily Checklist'
}

const PERMISSION_LABELS: Record<keyof ModulePermissions, string> = {
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
  publish: 'Publish'
}

const DEFAULT_PERMISSIONS: PermissionSet = {
  admin: { access: false },
  iceDepth: { access: false },
  iceOperations: { access: false },
  refrigeration: { access: false },
  airQuality: { access: false },
  incidents: { access: false },
  schedule: { access: false },
  dailyChecklist: { access: false }
}

export default function UsersPage() {
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [users, setUsers] = useState<UserData[]>([])
  const [roles, setRoles] = useState<RoleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // User filters
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [editingRole, setEditingRole] = useState<RoleData | null>(null)

  // Form states
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    roleId: '',
    smsOptIn: false
  })

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: DEFAULT_PERMISSIONS
  })

  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (roleFilter) params.set('roleId', roleFilter)
      params.set('status', statusFilter)

      const response = await fetch(`/api/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    }
  }, [searchQuery, roleFilter, statusFilter])

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/roles?includeSystem=true')
      if (response.ok) {
        const data = await response.json()
        setRoles(data)
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchUsers(), fetchRoles()])
      setLoading(false)
    }
    loadData()
  }, [fetchUsers, fetchRoles])

  const openUserModal = (user?: UserData) => {
    if (user) {
      setEditingUser(user)
      setUserForm({
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        roleId: user.role.id,
        smsOptIn: user.smsOptIn
      })
    } else {
      setEditingUser(null)
      setUserForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        roleId: roles[0]?.id || '',
        smsOptIn: false
      })
    }
    setShowUserModal(true)
  }

  const openRoleModal = (role?: RoleData) => {
    if (role) {
      setEditingRole(role)
      setRoleForm({
        name: role.name,
        description: role.description || '',
        permissions: role.permissions
      })
    } else {
      setEditingRole(null)
      setRoleForm({
        name: '',
        description: '',
        permissions: DEFAULT_PERMISSIONS
      })
    }
    setShowRoleModal(true)
  }

  const handleSaveUser = async () => {
    setSaving(true)
    setError('')

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const payload: Record<string, unknown> = {
        email: userForm.email,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        phone: userForm.phone || null,
        roleId: userForm.roleId,
        smsOptIn: userForm.smsOptIn
      }

      if (!editingUser && userForm.password) {
        payload.password = userForm.password
      } else if (editingUser && userForm.password) {
        payload.newPassword = userForm.password
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowUserModal(false)
        fetchUsers()
        fetchRoles()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save user')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRole = async () => {
    setSaving(true)
    setError('')

    try {
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles'
      const method = editingRole ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleForm.name,
          description: roleForm.description || null,
          permissions: roleForm.permissions
        })
      })

      if (response.ok) {
        setShowRoleModal(false)
        fetchRoles()
        fetchUsers()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save role')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleUserStatus = async (user: UserData) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive })
      })

      if (response.ok) {
        fetchUsers()
      }
    } catch (err) {
      console.error('Error toggling user status:', err)
    }
  }

  const handleDeleteRole = async (role: RoleData) => {
    if (role.userCount > 0) {
      setError('Cannot delete role with assigned users')
      return
    }

    if (!confirm(`Are you sure you want to delete the "${role.name}" role?`)) {
      return
    }

    try {
      const response = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchRoles()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete role')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const updatePermission = (
    module: ModuleType,
    permission: keyof ModulePermissions,
    value: boolean
  ) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: {
          ...prev.permissions[module],
          [permission]: value
        }
      }
    }))
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Users & Roles</h2>
            <p className="text-sm text-gray-500">Manage user accounts and access permissions</p>
          </div>
          <button
            onClick={() => activeTab === 'users' ? openUserModal() : openRoleModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {activeTab === 'users' ? '+ Add User' : '+ Add Role'}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
            <button onClick={() => setError('')} className="float-right text-red-500 hover:text-red-700">
              &times;
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Users ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Roles ({roles.length})
            </button>
          </nav>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Roles</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active Users</option>
                    <option value="inactive">Inactive Users</option>
                    <option value="all">All Users</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Last Login</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                            {user.role.name}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {formatDate(user.lastLoginAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openUserModal(user)}
                            className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className={`text-sm ${
                              user.isActive
                                ? 'text-orange-600 hover:text-orange-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            {roles.map(role => (
              <div key={role.id} className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{role.name}</h3>
                      {role.isSystemDefault && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                          System Default
                        </span>
                      )}
                    </div>
                    {role.description && (
                      <p className="text-sm text-gray-500 mt-1">{role.description}</p>
                    )}
                    <div className="text-sm text-gray-500 mt-2">
                      {role.userCount} user{role.userCount !== 1 ? 's' : ''} assigned
                    </div>
                  </div>
                  {!role.isSystemDefault && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openRoleModal(role)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role)}
                        className="text-red-600 hover:text-red-800 text-sm"
                        disabled={role.userCount > 0}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Permission summary */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {(Object.keys(MODULE_LABELS) as ModuleType[]).map(module => {
                    const perms = role.permissions[module]
                    if (!perms?.access) return null
                    return (
                      <span
                        key={module}
                        className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700"
                      >
                        {MODULE_LABELS[module]}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={editingUser ? 'Leave blank to keep current' : ''}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={userForm.phone}
                    onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={userForm.roleId}
                    onChange={(e) => setUserForm(prev => ({ ...prev, roleId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smsOptIn"
                    checked={userForm.smsOptIn}
                    onChange={(e) => setUserForm(prev => ({ ...prev, smsOptIn: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="smsOptIn" className="text-sm text-gray-700">
                    Opt-in to SMS notifications
                  </label>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Role Modal */}
        {showRoleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRole ? 'Edit Role' : 'Add New Role'}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Ice Tech, Manager, Supervisor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Brief description of this role's responsibilities"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Permissions</h4>
                  <div className="space-y-4">
                    {(Object.keys(MODULE_LABELS) as ModuleType[]).map(module => (
                      <div key={module} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <input
                            type="checkbox"
                            id={`${module}-access`}
                            checked={roleForm.permissions[module]?.access || false}
                            onChange={(e) => updatePermission(module, 'access', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`${module}-access`} className="font-medium text-gray-900">
                            {MODULE_LABELS[module]}
                          </label>
                        </div>

                        {roleForm.permissions[module]?.access && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 ml-6">
                            {(Object.keys(PERMISSION_LABELS) as Array<keyof ModulePermissions>)
                              .filter(p => p !== 'access')
                              .map(permission => (
                                <label key={permission} className="flex items-center gap-1.5 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={roleForm.permissions[module]?.[permission] || false}
                                    onChange={(e) => updatePermission(module, permission, e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-gray-600">{PERMISSION_LABELS[permission]}</span>
                                </label>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
