'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ShiftDefinition {
  id: string
  facilityId: string
  rinkId: string | null
  name: string
  startTime: string
  endTime: string
  color: string | null
  isActive: boolean
}

interface Rink {
  id: string
  name: string
  facilityId: string
}

export default function ShiftManagementPage() {
  const [shifts, setShifts] = useState<ShiftDefinition[]>([])
  const [rinks, setRinks] = useState<Rink[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    rinkId: '',
    color: '#3B82F6',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Mock facility ID - in production this would come from session
  const facilityId = 'facility-demo'

  useEffect(() => {
    fetchShifts()
    fetchRinks()
  }, [])

  const fetchShifts = async () => {
    try {
      const response = await fetch(`/api/shifts?facilityId=${facilityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch shifts')
      }
      const result = await response.json()
      setShifts(result.shifts || [])
    } catch (error) {
      console.error('Error fetching shifts:', error)
      alert('Failed to load shifts. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRinks = async () => {
    try {
      const response = await fetch(`/api/rinks?facilityId=${facilityId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch rinks')
      }
      const result = await response.json()
      setRinks(result.rinks || [])
    } catch (error) {
      console.error('Error fetching rinks:', error)
    }
  }

  const handleCreateNew = () => {
    setEditingShift(null)
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      rinkId: '',
      color: '#3B82F6',
    })
    setShowCreateForm(true)
  }

  const handleEdit = (shift: ShiftDefinition) => {
    setEditingShift(shift)
    setFormData({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      rinkId: shift.rinkId || '',
      color: shift.color || '#3B82F6',
    })
    setShowCreateForm(true)
  }

  const handleCancel = () => {
    setShowCreateForm(false)
    setEditingShift(null)
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      rinkId: '',
      color: '#3B82F6',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const body = {
        facilityId,
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        rinkId: formData.rinkId || null,
        color: formData.color,
      }

      const url = editingShift ? `/api/shifts/${editingShift.id}` : '/api/shifts'
      const method = editingShift ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save shift')
      }

      alert(editingShift ? 'Shift updated successfully!' : 'Shift created successfully!')
      handleCancel()
      fetchShifts()
    } catch (error) {
      console.error('Error saving shift:', error)
      alert(error instanceof Error ? error.message : 'Failed to save shift. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (shift: ShiftDefinition) => {
    if (!confirm(`Are you sure you want to delete the shift "${shift.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/shifts/${shift.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete shift')
      }

      alert('Shift deleted successfully!')
      fetchShifts()
    } catch (error) {
      console.error('Error deleting shift:', error)
      alert('Failed to delete shift. Please try again.')
    }
  }

  const getRinkName = (rinkId: string | null) => {
    if (!rinkId) return 'All Rinks (Facility-wide)'
    const rink = rinks.find((r) => r.id === rinkId)
    return rink ? rink.name : 'Unknown Rink'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-wolf-200 pb-4">
          <h1 className="text-3xl font-bold text-navy">Shift Management</h1>
          <p className="text-wolf-600 mt-2">Configure shift definitions for scheduling</p>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-wolf-600">Loading shifts...</p>
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
            <h1 className="text-3xl font-bold text-navy">Shift Management</h1>
            <p className="text-wolf-600 mt-2">Configure shift definitions for scheduling</p>
          </div>
          <Button onClick={handleCreateNew} disabled={showCreateForm}>
            Create New Shift
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingShift ? 'Edit Shift' : 'Create New Shift'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Shift Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                  placeholder="e.g., Morning Shift, Evening Shift"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    required
                  />
                  <p className="text-xs text-wolf-500 mt-1">24-hour format (HH:MM)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-navy mb-1">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                    required
                  />
                  <p className="text-xs text-wolf-500 mt-1">24-hour format (HH:MM)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Rink Assignment
                </label>
                <select
                  value={formData.rinkId}
                  onChange={(e) => setFormData({ ...formData, rinkId: e.target.value })}
                  className="w-full px-3 py-2 border border-wolf-300 rounded-md focus:outline-none focus:ring-2 focus:ring-action-green"
                >
                  <option value="">All Rinks (Facility-wide)</option>
                  {rinks.map((rink) => (
                    <option key={rink.id} value={rink.id}>
                      {rink.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-wolf-500 mt-1">
                  Leave blank for facility-wide shifts, or select a specific rink
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Shift Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 border border-wolf-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-wolf-600">{formData.color}</span>
                  <div
                    className="ml-auto px-4 py-2 rounded text-white font-medium"
                    style={{ backgroundColor: formData.color }}
                  >
                    Preview
                  </div>
                </div>
                <p className="text-xs text-wolf-500 mt-1">
                  Choose a color to help visually identify this shift in the schedule
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-wolf-200">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingShift ? 'Update Shift' : 'Create Shift'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Existing Shifts ({shifts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {shifts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wolf-600">No shifts defined yet.</p>
              <p className="text-sm text-wolf-500 mt-1">Create your first shift to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-4 border border-wolf-200 rounded-lg hover:border-action-green transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: shift.color || '#3B82F6' }}
                    />
                    <div>
                      <h3 className="font-semibold text-navy">{shift.name}</h3>
                      <p className="text-sm text-wolf-600">
                        {shift.startTime} - {shift.endTime}
                      </p>
                      <p className="text-xs text-wolf-500 mt-1">{getRinkName(shift.rinkId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {shift.isActive ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(shift)}
                      disabled={showCreateForm}
                    >
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(shift)}
                      disabled={showCreateForm}
                    >
                      Delete
                    </Button>
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
