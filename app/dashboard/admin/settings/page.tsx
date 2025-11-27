'use client'

import { useState, useEffect } from 'react'

interface FacilityInfo {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  timezone: string
}

interface FacilitySettings {
  // Data retention (days)
  iceDepthRetention: number
  iceOpsRetention: number
  refrigerationRetention: number
  airQualityRetention: number
  incidentRetention: number
  scheduleRetention: number
  checklistRetention: number
  // Air quality thresholds
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
  enableAirQualityAlerts: boolean
  // SMS settings
  smsEnabled: boolean
  smsProvider: string | null
  smsFromNumber: string | null
  smsQuietHoursStart: string | null
  smsQuietHoursEnd: string | null
  smsCriticalOverride: boolean
}

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
]

const DEFAULT_SETTINGS: FacilitySettings = {
  iceDepthRetention: 1095,
  iceOpsRetention: 1095,
  refrigerationRetention: 1095,
  airQualityRetention: 1095,
  incidentRetention: 2555,
  scheduleRetention: 1095,
  checklistRetention: 1095,
  coWarningPpm: 20,
  coEvacuationPpm: 83,
  no2WarningPpm: 0.3,
  no2EvacuationPpm: 2.0,
  enableAirQualityAlerts: true,
  smsEnabled: false,
  smsProvider: null,
  smsFromNumber: null,
  smsQuietHoursStart: null,
  smsQuietHoursEnd: null,
  smsCriticalOverride: true,
}

export default function SettingsPage() {
  const [facility, setFacility] = useState<FacilityInfo | null>(null)
  const [settings, setSettings] = useState<FacilitySettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [activeTab, setActiveTab] = useState<'facility' | 'retention' | 'airquality' | 'sms'>('facility')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.facility) setFacility(data.facility)
        if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings })
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility, settings }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'facility', label: 'Facility Info', icon: '🏢' },
    { id: 'retention', label: 'Data Retention', icon: '📁' },
    { id: 'airquality', label: 'Air Quality', icon: '💨' },
    { id: 'sms', label: 'SMS Notifications', icon: '📱' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Facility Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure facility information, data retention, and notification preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Facility Info Tab */}
      {activeTab === 'facility' && facility && (
        <div className="card space-y-4">
          <h3 className="font-medium text-gray-900">Facility Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
              <input
                type="text"
                value={facility.name}
                onChange={(e) => setFacility({ ...facility, name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={facility.timezone}
                onChange={(e) => setFacility({ ...facility, timezone: e.target.value })}
                className="input"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={facility.address}
                onChange={(e) => setFacility({ ...facility, address: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={facility.city}
                onChange={(e) => setFacility({ ...facility, city: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
              <input
                type="text"
                value={facility.state}
                onChange={(e) => setFacility({ ...facility, state: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
              <input
                type="text"
                value={facility.zipCode}
                onChange={(e) => setFacility({ ...facility, zipCode: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={facility.country}
                onChange={(e) => setFacility({ ...facility, country: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Data Retention Tab */}
      {activeTab === 'retention' && (
        <div className="card space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Data Retention Policies</h3>
            <p className="text-sm text-gray-500">Set how long data is retained before archival. Enter 0 for indefinite retention.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'iceDepthRetention', label: 'Ice Depth Records' },
              { key: 'iceOpsRetention', label: 'Ice Operations Records' },
              { key: 'refrigerationRetention', label: 'Refrigeration Records' },
              { key: 'airQualityRetention', label: 'Air Quality Records' },
              { key: 'incidentRetention', label: 'Incident Reports' },
              { key: 'scheduleRetention', label: 'Schedule Records' },
              { key: 'checklistRetention', label: 'Checklist Records' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings[key as keyof FacilitySettings] as number}
                    onChange={(e) => setSettings({ ...settings, [key]: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                  />
                  <span className="text-sm text-gray-500">days</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {(settings[key as keyof FacilitySettings] as number) === 0
                    ? 'Indefinite'
                    : `~${Math.round((settings[key as keyof FacilitySettings] as number) / 365)} years`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Air Quality Tab */}
      {activeTab === 'airquality' && (
        <div className="card space-y-6">
          <div>
            <h3 className="font-medium text-gray-900">Air Quality Thresholds</h3>
            <p className="text-sm text-gray-500">Configure warning and evacuation thresholds for air quality monitoring.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="enableAlerts"
              checked={settings.enableAirQualityAlerts}
              onChange={(e) => setSettings({ ...settings, enableAirQualityAlerts: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="enableAlerts" className="text-sm font-medium text-gray-700">
              Enable Air Quality Alerts
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-medium text-orange-800 mb-3">Carbon Monoxide (CO)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-orange-700 mb-1">Warning Level (PPM)</label>
                  <input
                    type="number"
                    value={settings.coWarningPpm}
                    onChange={(e) => setSettings({ ...settings, coWarningPpm: parseFloat(e.target.value) || 0 })}
                    className="input"
                    step="1"
                    min="0"
                  />
                  <p className="text-xs text-orange-600 mt-1">Default: 20 PPM</p>
                </div>
                <div>
                  <label className="block text-sm text-orange-700 mb-1">Evacuation Level (PPM)</label>
                  <input
                    type="number"
                    value={settings.coEvacuationPpm}
                    onChange={(e) => setSettings({ ...settings, coEvacuationPpm: parseFloat(e.target.value) || 0 })}
                    className="input"
                    step="1"
                    min="0"
                  />
                  <p className="text-xs text-orange-600 mt-1">Default: 83 PPM (OSHA 8-hour limit)</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-3">Nitrogen Dioxide (NO2)</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-yellow-700 mb-1">Warning Level (PPM)</label>
                  <input
                    type="number"
                    value={settings.no2WarningPpm}
                    onChange={(e) => setSettings({ ...settings, no2WarningPpm: parseFloat(e.target.value) || 0 })}
                    className="input"
                    step="0.1"
                    min="0"
                  />
                  <p className="text-xs text-yellow-600 mt-1">Default: 0.3 PPM</p>
                </div>
                <div>
                  <label className="block text-sm text-yellow-700 mb-1">Evacuation Level (PPM)</label>
                  <input
                    type="number"
                    value={settings.no2EvacuationPpm}
                    onChange={(e) => setSettings({ ...settings, no2EvacuationPpm: parseFloat(e.target.value) || 0 })}
                    className="input"
                    step="0.1"
                    min="0"
                  />
                  <p className="text-xs text-yellow-600 mt-1">Default: 2.0 PPM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SMS Notifications Tab */}
      {activeTab === 'sms' && (
        <div className="card space-y-6">
          <div>
            <h3 className="font-medium text-gray-900">SMS Notifications</h3>
            <p className="text-sm text-gray-500">Configure SMS alerts for critical events and emergencies.</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="smsEnabled"
              checked={settings.smsEnabled}
              onChange={(e) => setSettings({ ...settings, smsEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-700">
              Enable SMS Notifications
            </label>
          </div>

          {settings.smsEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
                  <select
                    value={settings.smsProvider || ''}
                    onChange={(e) => setSettings({ ...settings, smsProvider: e.target.value || null })}
                    className="input"
                  >
                    <option value="">Select provider...</option>
                    <option value="twilio">Twilio</option>
                    <option value="messagebird">MessageBird</option>
                    <option value="vonage">Vonage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Number</label>
                  <input
                    type="text"
                    value={settings.smsFromNumber || ''}
                    onChange={(e) => setSettings({ ...settings, smsFromNumber: e.target.value || null })}
                    className="input"
                    placeholder="+1234567890"
                  />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Quiet Hours</h4>
                <p className="text-sm text-gray-500 mb-3">Non-critical SMS will not be sent during quiet hours.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={settings.smsQuietHoursStart || ''}
                      onChange={(e) => setSettings({ ...settings, smsQuietHoursStart: e.target.value || null })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={settings.smsQuietHoursEnd || ''}
                      onChange={(e) => setSettings({ ...settings, smsQuietHoursEnd: e.target.value || null })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="criticalOverride"
                    checked={settings.smsCriticalOverride}
                    onChange={(e) => setSettings({ ...settings, smsCriticalOverride: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="criticalOverride" className="text-sm text-gray-600">
                    Critical alerts override quiet hours (ambulance calls, evacuations)
                  </label>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> SMS provider credentials (Account SID, Auth Token) should be configured via environment variables for security. Contact your system administrator to set up SMS integration.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  )
}
