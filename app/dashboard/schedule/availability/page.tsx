'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface AvailabilityDay {
  dayOfWeek: number
  isAvailable: boolean
  startTime: string | null
  endTime: string | null
  notes: string | null
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<AvailabilityDay[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAvailability()
  }, [])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/availability')
      const data = await res.json()

      if (res.ok) {
        setAvailability(data.availability || [])
      } else {
        setError(data.error || 'Failed to load availability')
      }
    } catch (err) {
      setError('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleDay = (dayOfWeek: number) => {
    setAvailability(prev =>
      prev.map(day =>
        day.dayOfWeek === dayOfWeek
          ? { ...day, isAvailable: !day.isAvailable }
          : day
      )
    )
  }

  const handleTimeChange = (
    dayOfWeek: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setAvailability(prev =>
      prev.map(day =>
        day.dayOfWeek === dayOfWeek ? { ...day, [field]: value || null } : day
      )
    )
  }

  const handleNotesChange = (dayOfWeek: number, value: string) => {
    setAvailability(prev =>
      prev.map(day =>
        day.dayOfWeek === dayOfWeek ? { ...day, notes: value || null } : day
      )
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability }),
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess('Availability saved successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save availability')
      }
    } catch (err) {
      setError('Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyToWeekdays = () => {
    const monday = availability.find(d => d.dayOfWeek === 1)
    if (!monday) return

    setAvailability(prev =>
      prev.map(day => {
        // Copy Monday settings to Tuesday-Friday
        if (day.dayOfWeek >= 2 && day.dayOfWeek <= 5) {
          return {
            ...day,
            isAvailable: monday.isAvailable,
            startTime: monday.startTime,
            endTime: monday.endTime,
          }
        }
        return day
      })
    )
  }

  const handleMarkAllAvailable = () => {
    setAvailability(prev =>
      prev.map(day => ({
        ...day,
        isAvailable: true,
      }))
    )
  }

  const handleClearAll = () => {
    setAvailability(prev =>
      prev.map(day => ({
        ...day,
        isAvailable: true,
        startTime: null,
        endTime: null,
        notes: null,
      }))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading availability...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Availability</h1>
          <p className="text-gray-600">
            Set your weekly availability for scheduling
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/schedule/time-off" className="btn-secondary">
            Time Off Requests
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleCopyToWeekdays}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Copy Monday to Weekdays
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={handleMarkAllAvailable}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Mark All Available
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={handleClearAll}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Reset All
        </button>
      </div>

      {/* Availability Grid */}
      <div className="card">
        <div className="space-y-4">
          {availability.map(day => (
            <div
              key={day.dayOfWeek}
              className={`p-4 rounded-lg border ${
                day.isAvailable
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={day.isAvailable}
                      onChange={() => handleToggleDay(day.dayOfWeek)}
                      className="w-5 h-5 rounded"
                    />
                    <span className="font-medium w-24">
                      {DAYS_OF_WEEK[day.dayOfWeek]}
                    </span>
                  </label>

                  {day.isAvailable && (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.startTime || ''}
                        onChange={e =>
                          handleTimeChange(day.dayOfWeek, 'startTime', e.target.value)
                        }
                        className="px-2 py-1 border rounded text-sm"
                        placeholder="Start"
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        value={day.endTime || ''}
                        onChange={e =>
                          handleTimeChange(day.dayOfWeek, 'endTime', e.target.value)
                        }
                        className="px-2 py-1 border rounded text-sm"
                        placeholder="End"
                      />
                      <span className="text-xs text-gray-400">
                        (leave blank for all day)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 max-w-xs">
                  <input
                    type="text"
                    value={day.notes || ''}
                    onChange={e => handleNotesChange(day.dayOfWeek, e.target.value)}
                    className="w-full px-2 py-1 border rounded text-sm"
                    placeholder="Notes (optional)"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 text-sm text-gray-500">
        <h3 className="font-medium text-gray-700 mb-2">Tips:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Toggle the checkbox to mark a day as available or unavailable
          </li>
          <li>
            Set specific times to indicate when you can work on that day
          </li>
          <li>Leave times blank to indicate you&apos;re available all day</li>
          <li>
            Add notes for any special circumstances or preferences
          </li>
          <li>
            Your manager will use this information when creating schedules
          </li>
        </ul>
      </div>
    </div>
  )
}
