'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ScheduleTemplate {
  id: string
  name: string
  description: string | null
  weekData: any[]
  isActive: boolean
  createdAt: string
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [applying, setApplying] = useState<string | null>(null)

  const [saveForm, setSaveForm] = useState({
    name: '',
    description: '',
    weekStartDate: '',
  })

  const [applyForm, setApplyForm] = useState({
    templateId: '',
    targetWeekStart: '',
    overwriteExisting: false,
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/schedule/templates')
      const data = await res.json()
      if (res.ok) {
        setTemplates(data.templates || [])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/schedule/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveForm),
      })

      const data = await res.json()

      if (res.ok) {
        await fetchTemplates()
        setShowSaveForm(false)
        setSaveForm({ name: '', description: '', weekStartDate: '' })
        alert('Template saved successfully!')
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to save template')
    }
  }

  const handleApplyTemplate = async (templateId: string) => {
    if (!applyForm.targetWeekStart) {
      alert('Please select a target week start date')
      return
    }

    setApplying(templateId)
    setError('')

    try {
      const res = await fetch(`/api/schedule/templates/${templateId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWeekStart: applyForm.targetWeekStart,
          overwriteExisting: applyForm.overwriteExisting,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to apply template')
    } finally {
      setApplying(null)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const getWeekStartDate = () => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek
    const sunday = new Date(today.setDate(diff))
    return sunday.toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/dashboard/schedule" className="text-blue-600 hover:underline text-sm">
            ← Back to Schedule
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Schedule Templates</h1>
          <p className="text-gray-600">Save and apply weekly schedule templates</p>
        </div>
        <button onClick={() => setShowSaveForm(true)} className="btn-primary">
          + Save Current Week
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Save Template Form */}
      {showSaveForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Save Week as Template</h2>
          <form onSubmit={handleSaveTemplate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={saveForm.name}
                  onChange={(e) => setSaveForm({ ...saveForm, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Standard Week, Holiday Schedule"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Week Starting (Sunday) *
                </label>
                <input
                  type="date"
                  value={saveForm.weekStartDate}
                  onChange={(e) => setSaveForm({ ...saveForm, weekStartDate: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={saveForm.description}
                onChange={(e) => setSaveForm({ ...saveForm, description: e.target.value })}
                className="input"
                rows={2}
                placeholder="Optional description..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowSaveForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Save Template
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Apply Template Section */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Apply Template</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Week Start (Sunday)
            </label>
            <input
              type="date"
              value={applyForm.targetWeekStart}
              onChange={(e) => setApplyForm({ ...applyForm, targetWeekStart: e.target.value })}
              className="input w-48"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={applyForm.overwriteExisting}
              onChange={(e) => setApplyForm({ ...applyForm, overwriteExisting: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Overwrite existing drafts</span>
          </label>
        </div>
      </div>

      {/* Templates List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Saved Templates</h2>
        {templates.length === 0 ? (
          <p className="text-gray-500">No templates saved yet. Save a week's schedule to create your first template.</p>
        ) : (
          <div className="space-y-4">
            {templates.map(template => {
              const entriesByDay: { [key: number]: any[] } = {}
              template.weekData.forEach((entry: any) => {
                if (!entriesByDay[entry.dayOfWeek]) {
                  entriesByDay[entry.dayOfWeek] = []
                }
                entriesByDay[entry.dayOfWeek].push(entry)
              })

              return (
                <div key={template.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      {template.description && (
                        <p className="text-sm text-gray-600">{template.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {template.weekData.length} shifts • Created {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApplyTemplate(template.id)}
                      disabled={applying === template.id || !applyForm.targetWeekStart}
                      className="btn-primary text-sm"
                    >
                      {applying === template.id ? 'Applying...' : 'Apply'}
                    </button>
                  </div>

                  {/* Preview grid */}
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {DAY_NAMES.map((day, index) => (
                      <div key={day} className="text-center">
                        <div className="font-medium text-gray-600 mb-1">{day}</div>
                        <div className="bg-gray-50 rounded p-1 min-h-[40px]">
                          {(entriesByDay[index] || []).slice(0, 2).map((entry: any, i: number) => (
                            <div key={i} className="text-[10px] truncate">
                              {entry.isOpenShift ? 'Open' : entry.userName?.split(' ')[0]}
                            </div>
                          ))}
                          {(entriesByDay[index]?.length || 0) > 2 && (
                            <div className="text-[10px] text-gray-400">
                              +{entriesByDay[index].length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
