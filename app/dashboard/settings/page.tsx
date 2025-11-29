'use client'

import { useState, useEffect } from 'react'

interface Preferences {
  email: {
    enabled: boolean
    incidentSubmitted: boolean
    incidentReviewed: boolean
    schedulePublished: boolean
    shiftReminder: boolean
    openShiftAvailable: boolean
    reportReminder: boolean
    systemAnnouncements: boolean
  }
  sms: {
    enabled: boolean
    preference: string
    incidentAmbulance: boolean
    airQualityEvacuation: boolean
    emergencyShift: boolean
  }
  push: {
    enabled: boolean
    incidentSubmitted: boolean
    scheduleChanges: boolean
    shiftReminder: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
    overrideForCritical: boolean
  }
}

const defaultPreferences: Preferences = {
  email: {
    enabled: true,
    incidentSubmitted: true,
    incidentReviewed: true,
    schedulePublished: true,
    shiftReminder: true,
    openShiftAvailable: true,
    reportReminder: true,
    systemAnnouncements: true,
  },
  sms: {
    enabled: false,
    preference: 'CRITICAL_ONLY',
    incidentAmbulance: true,
    airQualityEvacuation: true,
    emergencyShift: true,
  },
  push: {
    enabled: false,
    incidentSubmitted: true,
    scheduleChanges: true,
    shiftReminder: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    overrideForCritical: true,
  },
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetchPreferences()
  }, [])

  async function fetchPreferences() {
    try {
      setLoading(true)
      const response = await fetch('/api/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  async function savePreferences() {
    try {
      setSaving(true)
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })
      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setSaving(false)
    }
  }

  function updateEmail(key: keyof Preferences['email'], value: boolean) {
    setPreferences(prev => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }))
  }

  function updateSms(key: keyof Preferences['sms'], value: boolean | string) {
    setPreferences(prev => ({
      ...prev,
      sms: { ...prev.sms, [key]: value },
    }))
  }

  function updatePush(key: keyof Preferences['push'], value: boolean) {
    setPreferences(prev => ({
      ...prev,
      push: { ...prev.push, [key]: value },
    }))
  }

  function updateQuietHours(key: keyof Preferences['quietHours'], value: boolean | string) {
    setPreferences(prev => ({
      ...prev,
      quietHours: { ...prev.quietHours, [key]: value },
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your notification preferences</p>
        </div>
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Email Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Email Notifications</h2>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.email.enabled}
              onChange={e => updateEmail('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {preferences.email.enabled && (
          <div className="px-6 py-4 space-y-4">
            <NotificationToggle
              label="Incident Reports"
              description="When new incidents are submitted or reviewed"
              checked={preferences.email.incidentSubmitted}
              onChange={v => updateEmail('incidentSubmitted', v)}
            />
            <NotificationToggle
              label="Schedule Published"
              description="When new schedules are published"
              checked={preferences.email.schedulePublished}
              onChange={v => updateEmail('schedulePublished', v)}
            />
            <NotificationToggle
              label="Shift Reminders"
              description="Reminder before your scheduled shifts"
              checked={preferences.email.shiftReminder}
              onChange={v => updateEmail('shiftReminder', v)}
            />
            <NotificationToggle
              label="Open Shifts Available"
              description="When open shifts become available"
              checked={preferences.email.openShiftAvailable}
              onChange={v => updateEmail('openShiftAvailable', v)}
            />
            <NotificationToggle
              label="Report Reminders"
              description="Daily reminders to submit reports"
              checked={preferences.email.reportReminder}
              onChange={v => updateEmail('reportReminder', v)}
            />
            <NotificationToggle
              label="System Announcements"
              description="Important system updates and announcements"
              checked={preferences.email.systemAnnouncements}
              onChange={v => updateEmail('systemAnnouncements', v)}
            />
          </div>
        )}
      </div>

      {/* SMS Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">SMS Notifications</h2>
            <p className="text-sm text-gray-500">Receive critical alerts via text message</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.sms.enabled}
              onChange={e => updateSms('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {preferences.sms.enabled && (
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">SMS Preference</label>
              <select
                value={preferences.sms.preference}
                onChange={e => updateSms('preference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All notifications</option>
                <option value="CRITICAL_ONLY">Critical only (emergencies, evacuations)</option>
                <option value="NONE">None (disable SMS)</option>
              </select>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                <strong>Critical SMS alerts:</strong> Ambulance calls, air quality evacuations, and emergency coverage requests will always be sent regardless of preference (unless SMS is disabled).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Quiet Hours */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Quiet Hours</h2>
            <p className="text-sm text-gray-500">Pause non-critical notifications during specific hours</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.quietHours.enabled}
              onChange={e => updateQuietHours('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        {preferences.quietHours.enabled && (
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={preferences.quietHours.start}
                  onChange={e => updateQuietHours('start', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={preferences.quietHours.end}
                  onChange={e => updateQuietHours('end', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <NotificationToggle
              label="Override for Critical Alerts"
              description="Allow critical alerts even during quiet hours"
              checked={preferences.quietHours.overrideForCritical}
              onChange={v => updateQuietHours('overrideForCritical', v)}
            />
          </div>
        )}
      </div>

      {/* Push Notifications */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Push Notifications</h2>
            <p className="text-sm text-gray-500">Browser push notifications (coming soon)</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer opacity-50">
            <input
              type="checkbox"
              checked={preferences.push.enabled}
              onChange={e => updatePush('enabled', e.target.checked)}
              className="sr-only peer"
              disabled
            />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="px-6 py-4">
          <p className="text-sm text-gray-500">Push notifications will be available in a future update.</p>
        </div>
      </div>
    </div>
  )
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
      </label>
    </div>
  )
}
