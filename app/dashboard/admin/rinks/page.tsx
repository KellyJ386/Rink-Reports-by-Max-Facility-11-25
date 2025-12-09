'use client'

import { useState, useEffect } from 'react'

interface Rink {
  id: string
  name: string
  dimensions: string | null
  surfaceType: string
  isActive: boolean
  _count: {
    submissions: number
  }
}

export default function RinksPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingRink, setEditingRink] = useState<Rink | null>(null)
  const [formData, setFormData] = useState({ name: '', dimensions: '', surfaceType: 'ice' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchRinks()
  }, [])

  const fetchRinks = async () => {
    try {
      const res = await fetch('/api/rinks')
      if (!res.ok) throw new Error('Failed to fetch rinks')
      const data = await res.json()
      setRinks(data.rinks)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingRink ? `/api/rinks/${editingRink.id}` : '/api/rinks'
      const method = editingRink ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          dimensions: formData.dimensions || null,
          surfaceType: formData.surfaceType,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save rink')
      }

      fetchRinks()
      closeModal()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (rinkId: string, rinkName: string) => {
    if (!confirm(`Are you sure you want to deactivate "${rinkName}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/rinks/${rinkId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to deactivate rink')
      }
      fetchRinks()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const openModal = (rink?: Rink) => {
    if (rink) {
      setEditingRink(rink)
      setFormData({
        name: rink.name,
        dimensions: rink.dimensions || '',
        surfaceType: rink.surfaceType,
      })
    } else {
      setEditingRink(null)
      setFormData({ name: '', dimensions: '', surfaceType: 'ice' })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRink(null)
    setFormData({ name: '', dimensions: '', surfaceType: 'ice' })
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
          <h1 className="text-2xl font-bold text-gray-900">Rink Configuration</h1>
          <p className="text-gray-600 mt-1">
            Manage your facility's rinks and surfaces
          </p>
        </div>
        <button onClick={() => openModal()} className="btn btn-primary">
          + Add Rink
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {rinks.length === 0 ? (
          <div className="card p-12 text-center text-gray-500">
            No rinks configured. Add your first rink to get started.
          </div>
        ) : (
          rinks.map((rink) => (
            <div key={rink.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rink.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      rink.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {rink.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {rink.dimensions && <span>Dimensions: {rink.dimensions}</span>}
                    <span>Surface: {rink.surfaceType}</span>
                    <span>{rink._count.submissions} submissions</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openModal(rink)}
                    className="btn btn-secondary text-sm"
                  >
                    Edit
                  </button>
                  {rink.isActive && (
                    <button
                      onClick={() => handleDelete(rink.id, rink.name)}
                      className="btn bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRink ? 'Edit Rink' : 'Add New Rink'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rink Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Main Rink, Rink A, Studio"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dimensions
                </label>
                <input
                  type="text"
                  value={formData.dimensions}
                  onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., 200x85, Olympic"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Surface Type
                </label>
                <select
                  value={formData.surfaceType}
                  onChange={(e) => setFormData({ ...formData, surfaceType: e.target.value })}
                  className="input w-full"
                >
                  <option value="ice">Ice</option>
                  <option value="inline">Inline/Roller</option>
                  <option value="synthetic">Synthetic Ice</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={closeModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving ? 'Saving...' : editingRink ? 'Save Changes' : 'Add Rink'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
