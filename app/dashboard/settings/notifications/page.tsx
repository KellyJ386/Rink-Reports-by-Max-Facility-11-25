'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface NotificationPreferences {
  emailEnabled: boolean
  smsEnabled: boolean
  pushEnabled: boolean
  schedulePublished: boolean
  shiftReminder: boolean
  shiftReminderHours: number
  openShifts: boolean
  emergencyShifts: boolean
  timeOffUpdates: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string
  quietHoursEnd: string
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    schedulePublished: true,
    shiftReminder: true,
    shiftReminderHours: 24,
    openShifts: true,
    emergencyShifts: true,
    timeOffUpdates: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/settings/notifications')
      if (res.ok) {
        const data = await res.json()
        if (data.preferences) {
          setPreferences(prev => ({ ...prev, ...data.preferences }))
        }
      }
    } catch (err) {
      console.error('Error fetching preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      })

      if (res.ok) {
        setSuccess('Preferences saved successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save preferences')
      }
    } catch (err) {
      setError('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading preferences...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
          <p className="text-gray-600">Manage how you receive notifications</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
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

      {/* Delivery Methods */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Delivery Methods</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-gray-500">
                Receive notifications via email
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                preferences.emailEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => handleToggle('emailEnabled')}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  preferences.emailEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">SMS Notifications</div>
              <div className="text-sm text-gray-500">
                Receive text messages for urgent updates
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                preferences.smsEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => handleToggle('smsEnabled')}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  preferences.smsEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">In-App Notifications</div>
              <div className="text-sm text-gray-500">
                See notifications in the app
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                preferences.pushEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => handleToggle('pushEnabled')}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  preferences.pushEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Notification Types */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Notification Types</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Schedule Published</div>
              <div className="text-sm text-gray-500">
                When your schedule is published or updated
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                preferences.schedulePublished ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => handleToggle('schedulePublished')}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  preferences.schedulePublished ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Shift Reminders</div>
              <div className="text-sm text-gray-500">
                Reminder before your scheduled shift
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={preferences.shiftReminderHours}
                onChange={e =>
                  handleChange('shiftReminderHours', parseInt(e.target.value))
                }
                className="px-2 py-1 border rounded text-sm"
                disabled={!preferences.shiftReminder}
              >
                <option value={1}>1 hour</option>
                <option value={2}>2 hours</option>
                <option value={4}>4 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
              </select>
              <div
                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                  preferences.shiftReminder ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                onClick={() => handleToggle('shiftReminder')}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    preferences.shiftReminder ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Open Shifts</div>
              <div className="text-sm text-gray-500">
                When new open shifts are available
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                preferences.openShifts ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => handleToggle('openShifts')}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  preferences.openShifts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Emergency Coverage</div>
              <div className="text-sm text-gray-500">
                Urgent coverage requests (always via SMS if enabled)
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                preferences.emergencyShifts ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => handleToggle('emergencyShifts')}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  preferences.emergencyShifts ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Time Off Updates</div>
              <div className="text-sm text-gray-500">
                When your time-off requests are approved or denied
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                preferences.timeOffUpdates ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => handleToggle('timeOffUpdates')}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  preferences.timeOffUpdates ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quiet Hours</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-medium">Enable Quiet Hours</div>
              <div className="text-sm text-gray-500">
                Pause non-urgent notifications during specified hours
              </div>
            </div>
            <div
              className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                preferences.quietHoursEnabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              onClick={() => handleToggle('quietHoursEnabled')}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  preferences.quietHoursEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </div>
          </label>

          {preferences.quietHoursEnabled && (
            <div className="flex items-center gap-4 ml-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Start</label>
                <input
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={e => handleChange('quietHoursStart', e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">End</label>
                <input
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={e => handleChange('quietHoursEnd', e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Note: Emergency coverage notifications will always be delivered
            regardless of quiet hours settings.
          </p>
        </div>
      </div>
    </div>
  )
}
