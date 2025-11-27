'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
  dimensions: string | null
  surfaceType: string
  isActive: boolean
}

const SURFACE_TYPES = ['ice', 'inline']

const DIMENSION_PRESETS = [
  { label: 'NHL (200x85)', value: '200x85' },
  { label: 'Olympic (200x100)', value: '200x100' },
  { label: 'College (200x90)', value: '200x90' },
  { label: 'Studio/Practice', value: 'studio' },
  { label: 'Custom', value: 'custom' },
]

export default function RinksManagementPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Form state for new/edit rink
  const [isEditing, setIsEditing] = useState(false)
  const [editingRink, setEditingRink] = useState<Rink | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    dimensions: '',
    surfaceType: 'ice',
  })

  useEffect(() => {
    fetchRinks()
  }, [])

  const fetchRinks = async () => {
    try {
      const response = await fetch('/api/rinks')
      if (response.ok) {
        const data = await response.json()
        setRinks(data.rinks || [])
      }
    } catch (err) {
      setError('Failed to load rinks')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const url = editingRink ? `/api/rinks/${editingRink.id}` : '/api/rinks'
      const method = editingRink ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save rink')
      }

      setMessage({ type: 'success', text: editingRink ? 'Rink updated successfully' : 'Rink created successfully' })
      resetForm()
      fetchRinks()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save rink' })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (rink: Rink) => {
    setEditingRink(rink)
    setFormData({
      name: rink.name,
      dimensions: rink.dimensions || '',
      surfaceType: rink.surfaceType,
    })
    setIsEditing(true)
  }

  const handleDelete = async (rink: Rink) => {
    if (!confirm(`Are you sure you want to deactivate "${rink.name}"? This rink will no longer be available for new submissions.`)) {
      return
    }

    try {
      const response = await fetch(`/api/rinks/${rink.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete rink')
      }

      setMessage({ type: 'success', text: 'Rink deactivated successfully' })
      fetchRinks()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to delete rink' })
    }
  }

  const resetForm = () => {
    setEditingRink(null)
    setFormData({ name: '', dimensions: '', surfaceType: 'ice' })
    setIsEditing(false)
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rink Management</h1>
          <p className="text-gray-600 text-sm mt-1">Manage rinks and ice surfaces at your facility</p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">
            Add Rink
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">{error}</div>
      )}

      {/* Add/Edit Form */}
      {isEditing && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingRink ? 'Edit Rink' : 'Add New Rink'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rink Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Main Rink, Rink A, Studio"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Surface Type
              </label>
              <select
                value={formData.surfaceType}
                onChange={(e) => setFormData({ ...formData, surfaceType: e.target.value })}
                className="input"
              >
                {SURFACE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions
              </label>
              <select
                value={DIMENSION_PRESETS.find(p => p.value === formData.dimensions) ? formData.dimensions : 'custom'}
                onChange={(e) => {
                  if (e.target.value !== 'custom') {
                    setFormData({ ...formData, dimensions: e.target.value })
                  }
                }}
                className="input mb-2"
              >
                {DIMENSION_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </select>
              {(!DIMENSION_PRESETS.find(p => p.value === formData.dimensions) || formData.dimensions === 'custom') && (
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="input"
                  placeholder="Enter custom dimensions (e.g., 185x80)"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? 'Saving...' : editingRink ? 'Update Rink' : 'Create Rink'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rinks List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Rinks</h2>
        {rinks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🏒</div>
            <p>No rinks configured yet</p>
            <p className="text-sm">Add your first rink to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rinks.map((rink) => (
              <div key={rink.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">{rink.name}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="capitalize">{rink.surfaceType}</span>
                    {rink.dimensions && (
                      <>
                        <span>•</span>
                        <span>{rink.dimensions}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/admin/ice-depth?rink=${rink.id}`}
                    className="btn btn-secondary text-sm py-1"
                  >
                    Ice Depth Config
                  </Link>
                  <button
                    onClick={() => handleEdit(rink)}
                    className="btn btn-secondary text-sm py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(rink)}
                    className="btn btn-secondary text-sm py-1 text-red-600 hover:bg-red-50"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
