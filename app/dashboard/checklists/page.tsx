'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Rink {
  id: string
  name: string
}

interface Submission {
  id: string
  submittedAt: string
  rink: { id: string; name: string }
  submittedBy: { id: string; firstName: string; lastName: string }
  formTemplate: { id: string; name: string }
  data: Record<string, unknown>
}

interface ChecklistItem {
  id: string
  label: string
  required: boolean
}

const CHECKLIST_TYPES: Record<string, { label: string; icon: string; items: ChecklistItem[] }> = {
  'Opening Checklist': {
    label: 'Opening',
    icon: '🌅',
    items: [
      { id: 'lights', label: 'Turn on all lights', required: true },
      { id: 'hvac', label: 'Check HVAC system', required: true },
      { id: 'ice_inspect', label: 'Inspect ice surface', required: true },
      { id: 'boards', label: 'Check boards and glass', required: true },
      { id: 'goals', label: 'Set up goals', required: false },
      { id: 'benches', label: 'Clean benches', required: false },
      { id: 'zamboni', label: 'Check Zamboni fuel/water', required: true },
      { id: 'first_aid', label: 'Verify first aid kit', required: true },
      { id: 'exits', label: 'Check emergency exits', required: true },
      { id: 'temp', label: 'Record building temperature', required: false }
    ]
  },
  'Closing Checklist': {
    label: 'Closing',
    icon: '🌙',
    items: [
      { id: 'resurface', label: 'Final ice resurface', required: true },
      { id: 'lights_off', label: 'Turn off rink lights', required: true },
      { id: 'hvac_adjust', label: 'Adjust HVAC for overnight', required: true },
      { id: 'locker_check', label: 'Check locker rooms empty', required: true },
      { id: 'trash', label: 'Empty trash bins', required: false },
      { id: 'doors_locked', label: 'Lock all doors', required: true },
      { id: 'alarm', label: 'Set alarm system', required: true },
      { id: 'equipment', label: 'Secure equipment room', required: true }
    ]
  },
  'Maintenance Checklist': {
    label: 'Maintenance',
    icon: '🔧',
    items: [
      { id: 'compressor', label: 'Check compressor readings', required: true },
      { id: 'brine', label: 'Check brine levels', required: true },
      { id: 'filters', label: 'Inspect air filters', required: false },
      { id: 'dehumidifier', label: 'Check dehumidifier', required: false },
      { id: 'edger', label: 'Sharpen edger blades', required: false },
      { id: 'zamboni_maint', label: 'Zamboni maintenance check', required: false },
      { id: 'boards_repair', label: 'Inspect boards for damage', required: false },
      { id: 'lighting', label: 'Check all lighting', required: false }
    ]
  }
}

export default function ChecklistsPage() {
  const [rinks, setRinks] = useState<Rink[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [selectedRink, setSelectedRink] = useState('')
  const [checklistType, setChecklistType] = useState('')
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [notes, setNotes] = useState('')

  // Filter state
  const [filterRink, setFilterRink] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const fetchData = async () => {
    try {
      const params = new URLSearchParams()
      if (filterRink) params.set('rinkId', filterRink)
      if (filterType) params.set('type', filterType)
      if (filterDate) params.set('startDate', filterDate)

      const res = await fetch(`/api/checklists?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRinks(data.rinks || [])
        setSubmissions(data.submissions || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [filterRink, filterType, filterDate])

  useEffect(() => {
    if (checklistType && CHECKLIST_TYPES[checklistType]) {
      const initial: Record<string, boolean> = {}
      for (const item of CHECKLIST_TYPES[checklistType].items) {
        initial[item.id] = false
      }
      setCheckedItems(initial)
    }
  }, [checklistType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRink || !checklistType) return

    // Check required items
    const items = CHECKLIST_TYPES[checklistType].items
    const missingRequired = items.filter(item => item.required && !checkedItems[item.id])
    if (missingRequired.length > 0) {
      alert(`Please complete all required items:\n${missingRequired.map(i => `• ${i.label}`).join('\n')}`)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rinkId: selectedRink,
          checklistType,
          items: checkedItems,
          notes
        })
      })

      if (res.ok) {
        setShowForm(false)
        resetForm()
        fetchData()
      } else {
        alert('Failed to save checklist')
      }
    } catch (error) {
      alert('Failed to save checklist')
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedRink('')
    setChecklistType('')
    setCheckedItems({})
    setNotes('')
  }

  const toggleItem = (itemId: string) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString()
  }

  const getCompletionColor = (percent: number) => {
    if (percent === 100) return 'text-green-600 bg-green-100'
    if (percent >= 75) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Daily Checklists</h1>
          <p className="text-gray-600 mt-1">Opening, closing, and maintenance checklists</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + Start Checklist
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(CHECKLIST_TYPES).map(([key, type]) => (
          <button
            key={key}
            onClick={() => {
              setChecklistType(key)
              setShowForm(true)
            }}
            className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
          >
            <span className="text-4xl mb-2">{type.icon}</span>
            <span className="text-lg font-medium text-gray-900">{type.label}</span>
            <span className="text-sm text-gray-500">{type.items.length} items</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rink</label>
            <select
              value={filterRink}
              onChange={(e) => setFilterRink(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="">All Rinks</option>
              {rinks.map((rink) => (
                <option key={rink.id} value={rink.id}>{rink.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[150px]"
            >
              <option value="">All Types</option>
              {Object.keys(CHECKLIST_TYPES).map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Checklists Log */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Completed Checklists</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No checklists completed yet. Click "Start Checklist" to begin.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {submissions.map((sub) => {
              const data = sub.data as Record<string, unknown>
              const percent = (data.completionPercent as number) || 0
              const typeInfo = CHECKLIST_TYPES[sub.formTemplate.name]

              return (
                <div key={sub.id} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{typeInfo?.icon || '✓'}</span>
                      <div>
                        <div className="font-medium text-gray-900">{sub.formTemplate.name}</div>
                        <div className="text-sm text-gray-500">
                          {sub.rink.name} • {sub.submittedBy.firstName} {sub.submittedBy.lastName}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm px-2 py-1 rounded-full ${getCompletionColor(percent)}`}>
                        {String(data.completedItems)}/{String(data.totalItems)} ({percent}%)
                      </span>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">{formatTime(sub.submittedAt)}</div>
                        <div className="text-sm text-gray-500">{formatDate(sub.submittedAt)}</div>
                      </div>
                    </div>
                  </div>
                  {data.notes != null && (
                    <div className="mt-2 ml-11 text-sm text-gray-500 italic">
                      {String(data.notes)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Checklist Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="font-semibold text-gray-900">
                {checklistType ? CHECKLIST_TYPES[checklistType]?.label + ' Checklist' : 'Start Checklist'}
              </h2>
              <button onClick={() => { setShowForm(false); resetForm() }} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rink *</label>
                  <select
                    value={selectedRink}
                    onChange={(e) => setSelectedRink(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select rink...</option>
                    {rinks.map((rink) => (
                      <option key={rink.id} value={rink.id}>{rink.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Checklist Type *</label>
                  <select
                    value={checklistType}
                    onChange={(e) => setChecklistType(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Select type...</option>
                    {Object.entries(CHECKLIST_TYPES).map(([key, type]) => (
                      <option key={key} value={key}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {checklistType && CHECKLIST_TYPES[checklistType] && (
                <div className="border rounded-lg divide-y">
                  {CHECKLIST_TYPES[checklistType].items.map((item) => (
                    <label
                      key={item.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                        checkedItems[item.id] ? 'bg-green-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems[item.id] || false}
                        onChange={() => toggleItem(item.id)}
                        className="w-5 h-5 text-green-600 rounded"
                      />
                      <span className={`flex-1 ${checkedItems[item.id] ? 'line-through text-gray-400' : ''}`}>
                        {item.label}
                      </span>
                      {item.required && (
                        <span className="text-xs text-red-500">Required</span>
                      )}
                    </label>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Any issues or observations..."
                />
              </div>

              {checklistType && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <div className="flex justify-between">
                    <span>Completion:</span>
                    <span className="font-medium">
                      {Object.values(checkedItems).filter(Boolean).length} / {Object.keys(checkedItems).length}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm() }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedRink || !checklistType}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Complete Checklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
