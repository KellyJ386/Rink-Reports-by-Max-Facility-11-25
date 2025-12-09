'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RecurringPattern {
  id: string
  name: string
  description: string | null
  patternType: string
  daysOfWeek: number[]
  startTime: string
  endTime: string
  isActive: boolean
  assignments: { userId: string; dayOfWeek: number }[]
}

interface Employee {
  id: string
  firstName: string
  lastName: string
  role: { name: string }
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function RecurringPatternsPage() {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    patternType: 'WEEKLY',
    daysOfWeek: [] as number[],
    startTime: '',
    endTime: '',
    startDate: '',
    endDate: '',
  })

  const [generateForm, setGenerateForm] = useState({
    patternId: '',
    startDate: '',
    endDate: '',
    overwriteExisting: false,
  })

  useEffect(() => {
    fetchPatterns()
    fetchEmployees()
  }, [])

  const fetchPatterns = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/schedule/recurring')
      const data = await res.json()
      if (res.ok) {
        setPatterns(data.patterns || [])
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to load patterns')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/employees')
      const data = await res.json()
      if (res.ok) {
        setEmployees(data.employees || [])
      }
    } catch (err) {
      console.error('Failed to load employees')
    }
  }

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/schedule/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok) {
        await fetchPatterns()
        setShowForm(false)
        setFormData({
          name: '',
          description: '',
          patternType: 'WEEKLY',
          daysOfWeek: [],
          startTime: '',
          endTime: '',
          startDate: '',
          endDate: '',
        })
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to create pattern')
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setGenerating(true)

    try {
      const res = await fetch('/api/schedule/recurring/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generateForm),
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
        setGenerateForm({
          patternId: '',
          startDate: '',
          endDate: '',
          overwriteExisting: false,
        })
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError('Failed to generate schedule')
    } finally {
      setGenerating(false)
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
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
          <h1 className="text-3xl font-bold text-gray-900 mt-1">Recurring Patterns</h1>
          <p className="text-gray-600">Set up recurring shift patterns for automatic scheduling</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          + New Pattern
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Create Pattern Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">Create Recurring Pattern</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pattern Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Morning Shift Pattern"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pattern Type
                </label>
                <select
                  value={formData.patternType}
                  onChange={(e) => setFormData({ ...formData, patternType: e.target.value })}
                  className="input"
                >
                  <option value="WEEKLY">Weekly</option>
                  <option value="BI_WEEKLY">Bi-Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of Week *
              </label>
              <div className="flex gap-2">
                {DAY_NAMES.map((day, index) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(index)}
                    className={`px-3 py-2 rounded font-medium text-sm ${
                      formData.daysOfWeek.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="input"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pattern Start Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pattern End Date (optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={2}
                placeholder="Optional description..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Pattern
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Generate Schedule Form */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Generate Schedule from Patterns</h2>
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pattern (optional)
              </label>
              <select
                value={generateForm.patternId}
                onChange={(e) => setGenerateForm({ ...generateForm, patternId: e.target.value })}
                className="input"
              >
                <option value="">All Active Patterns</option>
                {patterns.filter(p => p.isActive).map(pattern => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                value={generateForm.startDate}
                onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date *
              </label>
              <input
                type="date"
                value={generateForm.endDate}
                onChange={(e) => setGenerateForm({ ...generateForm, endDate: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={generateForm.overwriteExisting}
                onChange={(e) => setGenerateForm({ ...generateForm, overwriteExisting: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm">Overwrite existing draft entries</span>
            </label>
            <button type="submit" disabled={generating} className="btn-primary">
              {generating ? 'Generating...' : 'Generate Schedule'}
            </button>
          </div>
        </form>
      </div>

      {/* Patterns List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Saved Patterns</h2>
        {patterns.length === 0 ? (
          <p className="text-gray-500">No recurring patterns defined yet.</p>
        ) : (
          <div className="space-y-4">
            {patterns.map(pattern => (
              <div
                key={pattern.id}
                className={`border rounded-lg p-4 ${pattern.isActive ? '' : 'opacity-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{pattern.name}</h3>
                    {pattern.description && (
                      <p className="text-sm text-gray-600">{pattern.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    pattern.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {pattern.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>
                    <strong>Type:</strong> {pattern.patternType.replace('_', '-')}
                  </span>
                  <span>
                    <strong>Time:</strong> {formatTime(pattern.startTime)} - {formatTime(pattern.endTime)}
                  </span>
                  <span>
                    <strong>Days:</strong>{' '}
                    {pattern.daysOfWeek.map(d => DAY_NAMES[d]).join(', ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
