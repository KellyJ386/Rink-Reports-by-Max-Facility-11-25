'use client'

import { useState } from 'react'

interface CopyWeekModalProps {
  currentWeekStart: Date
  onClose: () => void
  onSuccess: () => void
}

export default function CopyWeekModal({
  currentWeekStart,
  onClose,
  onSuccess,
}: CopyWeekModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    targetWeekStart: '',
    overwriteExisting: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/schedule/copy-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWeekStart: currentWeekStart.toISOString().split('T')[0],
          targetWeekStart: formData.targetWeekStart,
          overwriteExisting: formData.overwriteExisting,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        alert(data.message)
        onSuccess()
      } else {
        setError(data.error || 'Failed to copy week')
      }
    } catch (err) {
      setError('Failed to copy week')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const weekEnd = new Date(currentWeekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Copy Week</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Source Week:</strong><br />
              {formatDate(currentWeekStart)} - {formatDate(weekEnd)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Copy to Week Starting (Sunday) *
            </label>
            <input
              type="date"
              value={formData.targetWeekStart}
              onChange={(e) => setFormData({ ...formData, targetWeekStart: e.target.value })}
              className="input"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Select the Sunday of the target week
            </p>
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.overwriteExisting}
              onChange={(e) => setFormData({ ...formData, overwriteExisting: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Overwrite existing draft entries in target week</span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button type="button" onClick={onClose} disabled={loading} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Copying...' : 'Copy Week'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
