'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ChecklistItem {
  id: string
  label: string
  required: boolean
}

interface Template {
  id: string
  name: string
  description: string | null
  isActive: boolean
  schema: {
    fields: ChecklistItem[]
  }
}

export default function ChecklistTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newItemRequired, setNewItemRequired] = useState(false)

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/checklists/templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const addItem = () => {
    if (!newItemLabel.trim()) return
    const id = `item_${Date.now()}`
    setItems([...items, { id, label: newItemLabel.trim(), required: newItemRequired }])
    setNewItemLabel('')
    setNewItemRequired(false)
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    const temp = newItems[index]
    newItems[index] = newItems[targetIndex]
    newItems[targetIndex] = temp
    setItems(newItems)
  }

  const toggleRequired = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, required: !item.required } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || items.length === 0) {
      alert('Please provide a name and at least one checklist item')
      return
    }

    setSubmitting(true)
    try {
      const method = editingTemplate ? 'PUT' : 'POST'
      const res = await fetch('/api/checklists/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingTemplate?.id,
          name: name.trim(),
          description: description.trim() || null,
          items
        })
      })

      if (res.ok) {
        setShowForm(false)
        resetForm()
        fetchTemplates()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to save template')
      }
    } catch (error) {
      alert('Failed to save template')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setName(template.name)
    setDescription(template.description || '')
    setItems(template.schema.fields || [])
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const res = await fetch('/api/checklists/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (res.ok) {
        fetchTemplates()
      } else {
        alert('Failed to delete template')
      }
    } catch (error) {
      alert('Failed to delete template')
    }
  }

  const resetForm = () => {
    setEditingTemplate(null)
    setName('')
    setDescription('')
    setItems([])
    setNewItemLabel('')
    setNewItemRequired(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/checklists"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            &larr; Back to Checklists
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Checklist Templates</h1>
          <p className="text-gray-600 mt-1">Create and manage custom checklist templates</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Templates</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No custom templates yet. Click "New Template" to create one.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {templates.map((template) => (
              <div key={template.id} className="px-4 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{template.name}</div>
                    {template.description && (
                      <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                    )}
                    <div className="text-sm text-gray-400 mt-1">
                      {template.schema.fields?.length || 0} items
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(template)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(template.id)}
                      className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h2>
              <button
                onClick={() => { setShowForm(false); resetForm() }}
                className="text-gray-400 hover:text-gray-600"
              >
                x
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g., Weekly Safety Inspection"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Checklist Items ({items.length})
                </label>

                {items.length > 0 && (
                  <div className="border rounded-lg divide-y mb-3">
                    {items.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2 p-2">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => moveItem(index, 'up')}
                            disabled={index === 0}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            &uarr;
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(index, 'down')}
                            disabled={index === items.length - 1}
                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                          >
                            &darr;
                          </button>
                        </div>
                        <span className="flex-1 text-sm">{item.label}</span>
                        <button
                          type="button"
                          onClick={() => toggleRequired(item.id)}
                          className={`text-xs px-2 py-1 rounded ${
                            item.required
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {item.required ? 'Required' : 'Optional'}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newItemLabel}
                    onChange={(e) => setNewItemLabel(e.target.value)}
                    placeholder="New item label"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addItem()
                      }
                    }}
                  />
                  <label className="flex items-center gap-1 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={newItemRequired}
                      onChange={(e) => setNewItemRequired(e.target.checked)}
                      className="w-4 h-4"
                    />
                    Req
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim() || items.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
