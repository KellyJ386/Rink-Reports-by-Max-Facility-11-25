'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Facility {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  phone: string | null
  email: string | null
  timezone: string
  subscriptionTier: 'TRIAL' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  subscriptionStatus: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED'
  maxUsers: number
  maxRinks: number
  isActive: boolean
  createdAt: string
  _count?: {
    users: number
    rinks: number
    submissions: number
  }
}

export default function FacilitiesAdminPage() {
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    timezone: 'America/Los_Angeles',
    subscriptionTier: 'TRIAL' as 'TRIAL' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE',
    maxUsers: 10,
    maxRinks: 2,
  })

  useEffect(() => {
    fetchFacilities()
  }, [])

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
      alert('Failed to load facilities. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingFacility(null)
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      timezone: 'America/Los_Angeles',
      subscriptionTier: 'TRIAL',
      maxUsers: 10,
      maxRinks: 2,
    })
    setShowCreateForm(true)
  }

  const handleEdit = (facility: Facility) => {
    setEditingFacility(facility)
    setFormData({
      name: facility.name,
      address: facility.address || '',
      city: facility.city || '',
      state: facility.state || '',
      zipCode: facility.zipCode || '',
      phone: facility.phone || '',
      email: facility.email || '',
      timezone: facility.timezone,
      subscriptionTier: facility.subscriptionTier,
      maxUsers: facility.maxUsers,
      maxRinks: facility.maxRinks,
    })
    setShowCreateForm(true)
  }

  const handleCancel = () => {
    setShowCreateForm(false)
    setEditingFacility(null)
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: '',
      timezone: 'America/Los_Angeles',
      subscriptionTier: 'TRIAL',
      maxUsers: 10,
      maxRinks: 2,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const url = editingFacility ? `/api/facilities/${editingFacility.id}` : '/api/facilities'
      const method = editingFacility ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save facility')
      }

      alert(
        editingFacility ? 'Facility updated successfully!' : 'Facility created successfully!'
      )
      handleCancel()
      fetchFacilities()
    } catch (error) {
      console.error('Error saving facility:', error)
      alert(error instanceof Error ? error.message : 'Failed to save facility. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeactivate = async (facility: Facility) => {
    if (
      !confirm(
        `Are you sure you want to deactivate "${facility.name}"? This will cancel their subscription and prevent access.`
      )
    ) {
      return
    }

    try {
      const response = await fetch(`/api/facilities/${facility.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to deactivate facility')
      }

      alert('Facility deactivated successfully!')
      fetchFacilities()
    } catch (error) {
      console.error('Error deactivating facility:', error)
      alert('Failed to deactivate facility. Please try again.')
    }
  }

  const getSubscriptionBadge = (tier: string) => {
    switch (tier) {
      case 'TRIAL':
        return <Badge variant="warning">Trial</Badge>
      case 'BASIC':
        return <Badge variant="default">Basic</Badge>
      case 'PROFESSIONAL':
        return <Badge variant="default" className="bg-blue-500">Professional</Badge>
      case 'ENTERPRISE':
        return <Badge variant="default" className="bg-purple-500">Enterprise</Badge>
      default:
        return <Badge>{tier}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Active</Badge>
      case 'PAST_DUE':
        return <Badge variant="warning">Past Due</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      case 'SUSPENDED':
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">Facility Management</h1>
          <p className="text-wolf-600 mt-2">Manage all facilities in the system</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-wolf-600">Loading facilities...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-wolf-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-navy">Facility Management</h1>
            <p className="text-wolf-600 mt-2">Manage all facilities in the system</p>
          </div>
          <Button onClick={handleCreateNew} disabled={showCreateForm}>
            Create New Facility
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Total Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">{facilities.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-action-green">
              {facilities.filter((f) => f.isActive && f.subscriptionStatus === 'ACTIVE').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Trial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {facilities.filter((f) => f.subscriptionTier === 'TRIAL').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-wolf-600">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-navy">
              {facilities.reduce((sum, f) => sum + (f._count?.users || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingFacility ? 'Edit Facility' : 'Create New Facility'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Facility Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    placeholder="Ice Rink Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    placeholder="facility@example.com"
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
                  <label className="block text-sm font-medium text-navy mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    placeholder="123 Main St"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    placeholder="Seattle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    placeholder="WA"
                    maxLength={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    placeholder="98101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Timezone</label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                  >
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/New_York">Eastern Time (ET)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Subscription Tier</label>
                  <select
                    value={formData.subscriptionTier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subscriptionTier: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                  >
                    <option value="TRIAL">Trial (14 days)</option>
                    <option value="BASIC">Basic ($99/month)</option>
                    <option value="PROFESSIONAL">Professional ($299/month)</option>
                    <option value="ENTERPRISE">Enterprise (Custom)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Max Users</label>
                  <input
                    type="number"
                    value={formData.maxUsers}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Max Rinks</label>
                  <input
                    type="number"
                    value={formData.maxRinks}
                    onChange={(e) =>
                      setFormData({ ...formData, maxRinks: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    min="1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-wolf-200">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingFacility ? 'Update Facility' : 'Create Facility'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Facilities List */}
      <Card>
        <CardHeader>
          <CardTitle>All Facilities ({facilities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {facilities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wolf-600">No facilities found.</p>
              <p className="text-sm text-wolf-500 mt-1">Create your first facility to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {facilities.map((facility) => (
                <div
                  key={facility.id}
                  className="flex items-center justify-between p-4 border border-wolf-200 rounded-lg hover:border-action-green transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-navy text-lg">{facility.name}</h3>
                      {getSubscriptionBadge(facility.subscriptionTier)}
                      {getStatusBadge(facility.subscriptionStatus)}
                      {!facility.isActive && <Badge variant="destructive">Inactive</Badge>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-wolf-600">
                      <div>
                        <span className="font-medium">Location:</span>{' '}
                        {facility.city && facility.state
                          ? `${facility.city}, ${facility.state}`
                          : 'Not set'}
                      </div>
                      <div>
                        <span className="font-medium">Users:</span>{' '}
                        {facility._count?.users || 0} / {facility.maxUsers}
                      </div>
                      <div>
                        <span className="font-medium">Rinks:</span>{' '}
                        {facility._count?.rinks || 0} / {facility.maxRinks}
                      </div>
                      <div>
                        <span className="font-medium">Reports:</span> {facility._count?.submissions || 0}
                      </div>
                    </div>
                    {facility.email && (
                      <p className="text-xs text-wolf-500 mt-1">📧 {facility.email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(facility)}
                      disabled={showCreateForm}
                    >
                      Edit
                    </Button>
                    {facility.isActive && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(facility)}
                        disabled={showCreateForm}
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
