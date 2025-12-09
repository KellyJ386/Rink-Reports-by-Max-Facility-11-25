'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  facilityId: string
  facility: {
    id: string
    name: string
  }
  roleId: string
  role: {
    id: string
    name: string
    description: string | null
  }
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

interface Facility {
  id: string
  name: string
}

interface Role {
  id: string
  name: string
  description: string | null
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFacility, setSelectedFacility] = useState<string>('')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    roleId: '',
    facilityId: '',
    isActive: true,
  })

  // Mock facility ID - in production this would come from session/context
  const facilityId = 'facility-demo'

  useEffect(() => {
    fetchUsers()
    fetchFacilities()
    fetchRoles()
  }, [selectedFacility, showActiveOnly])

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams()
      if (selectedFacility) params.append('facilityId', selectedFacility)

      const response = await fetch(`/api/users?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      const result = await response.json()
      let filteredUsers = result.users || []

      if (showActiveOnly) {
        filteredUsers = filteredUsers.filter((u: User) => u.isActive)
      }

      setUsers(filteredUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to load users. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities')
      if (!response.ok) {
        throw new Error('Failed to fetch facilities')
      }
      const result = await response.json()
      setFacilities(result.facilities || [])
    } catch (error) {
      console.error('Error fetching facilities:', error)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (!response.ok) {
        throw new Error('Failed to fetch roles')
      }
      const result = await response.json()
      setRoles(result.roles || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      roleId: user.roleId,
      facilityId: user.facilityId,
      isActive: user.isActive,
    })
    setShowEditForm(true)
  }

  const handleCancel = () => {
    setShowEditForm(false)
    setEditingUser(null)
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: '',
      facilityId: '',
      isActive: true,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      alert('User updated successfully!')
      handleCancel()
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      alert(error instanceof Error ? error.message : 'Failed to update user. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async (user: User) => {
    if (
      !confirm(
        `Are you sure you want to deactivate ${user.firstName} ${user.lastName}? They will lose access to the system.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate user')
      }

      alert('User deactivated successfully!')
      fetchUsers()
    } catch (error) {
      console.error('Error deactivating user:', error)
      alert('Failed to deactivate user. Please try again.')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">User Management</h1>
          <p className="text-wolf-600 mt-2">Manage users across all facilities</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-wolf-600">Loading users...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-wolf-200 pb-4">
        <h1 className="text-3xl font-bold text-navy">User Management</h1>
        <p className="text-wolf-600 mt-2">Manage users across all facilities</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-action-green">
              {users.filter((u) => u.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-wolf-600">
              {users.filter((u) => !u.isActive).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{facilities.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium text-navy mr-2">Facility:</label>
              <select
                value={selectedFacility}
                onChange={(e) => setSelectedFacility(e.target.value)}
                className="px-3 py-2 border border-wolf-300 rounded-md text-sm"
              >
                <option value="">All Facilities</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="activeOnly"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="activeOnly" className="text-sm text-navy">
                Show active users only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      {showEditForm && editingUser && (
        <Card>
          <CardHeader>
            <CardTitle>Edit User: {editingUser.firstName} {editingUser.lastName}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Facility <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.facilityId}
                    onChange={(e) => setFormData({ ...formData, facilityId: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    required
                  >
                    <option value="">Select Facility</option>
                    {facilities.map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm text-navy">
                  Active (user can access the system)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-wolf-200">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Update User'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wolf-600">No users found.</p>
              <p className="text-sm text-wolf-500 mt-1">Adjust your filters or check back later.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-wolf-200 rounded-lg hover:border-action-green transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-navy">
                        {user.firstName} {user.lastName}
                      </h3>
                      {user.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-wolf-600">
                      <div>
                        <span className="font-medium">Email:</span> {user.email}
                      </div>
                      <div>
                        <span className="font-medium">Facility:</span> {user.facility.name}
                      </div>
                      <div>
                        <span className="font-medium">Role:</span> {user.role.name}
                      </div>
                      <div>
                        <span className="font-medium">Last Login:</span> {formatDate(user.lastLoginAt)}
                      </div>
                    </div>
                    {user.phone && (
                      <p className="text-xs text-wolf-500 mt-1">📞 {user.phone}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      disabled={showEditForm}
                    >
                      Edit
                    </Button>
                    {user.isActive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(user)}
                        disabled={showEditForm}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
