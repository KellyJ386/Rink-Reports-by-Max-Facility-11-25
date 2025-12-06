'use client'

import { useState, useEffect, useCallback } from 'react'

interface FacilityData {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  timezone: string
}

interface SettingsData {
  id: string
  // Retention
  iceDepthRetention: number
  iceOpsRetention: number
  refrigerationRetention: number
  airQualityRetention: number
  incidentRetention: number
  scheduleRetention: number
  checklistRetention: number
  // Air quality
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
  enableAirQualityAlerts: boolean
  // SMS
  smsEnabled: boolean
  smsProvider: string | null
  smsFromNumber: string | null
  smsQuietHoursStart: string | null
  smsQuietHoursEnd: string | null
  smsCriticalOverride: boolean
}

interface RinkData {
  id: string
  name: string
  dimensions: string | null
  surfaceType: string
  isActive: boolean
  hasIceDepthConfig: boolean
  iceDepthPreset: string | null
  stats: {
    submissions: number
    scheduleEntries: number
    shiftDefinitions: number
  }
}

type TabType = 'general' | 'rinks' | 'notifications' | 'retention' | 'airQuality'

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'America/Toronto', label: 'Eastern Time - Canada' },
  { value: 'America/Vancouver', label: 'Pacific Time - Canada' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' }
]

const SMS_PROVIDERS = [
  { value: 'twilio', label: 'Twilio' },
  { value: 'messagebird', label: 'MessageBird' },
  { value: 'vonage', label: 'Vonage (Nexmo)' }
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [facility, setFacility] = useState<FacilityData | null>(null)
  const [settings, setSettings] = useState<SettingsData | null>(null)
  const [rinks, setRinks] = useState<RinkData[]>([])

  // Rink modal
  const [showRinkModal, setShowRinkModal] = useState(false)
  const [editingRink, setEditingRink] = useState<RinkData | null>(null)
  const [rinkForm, setRinkForm] = useState({ name: '', dimensions: '', surfaceType: 'ice' })

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setFacility(data.facility)
        setSettings(data.settings)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError('Failed to load settings')
    }
  }, [])

  const fetchRinks = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/rinks?includeInactive=true')
      if (response.ok) {
        const data = await response.json()
        setRinks(data)
      }
    } catch (err) {
      console.error('Error fetching rinks:', err)
    }
  }, [])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchSettings(), fetchRinks()])
      setLoading(false)
    }
    loadData()
  }, [fetchSettings, fetchRinks])

  const handleSaveSettings = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility, settings })
      })

      if (response.ok) {
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save settings')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const openRinkModal = (rink?: RinkData) => {
    if (rink) {
      setEditingRink(rink)
      setRinkForm({
        name: rink.name,
        dimensions: rink.dimensions || '',
        surfaceType: rink.surfaceType
      })
    } else {
      setEditingRink(null)
      setRinkForm({ name: '', dimensions: '', surfaceType: 'ice' })
    }
    setShowRinkModal(true)
  }

  const handleSaveRink = async () => {
    setSaving(true)
    setError('')

    try {
      const url = editingRink ? `/api/settings/rinks/${editingRink.id}` : '/api/settings/rinks'
      const method = editingRink ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rinkForm)
      })

      if (response.ok) {
        setShowRinkModal(false)
        fetchRinks()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to save rink')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleRinkStatus = async (rink: RinkData) => {
    try {
      const response = await fetch(`/api/settings/rinks/${rink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rink.isActive })
      })

      if (response.ok) {
        fetchRinks()
      }
    } catch (err) {
      console.error('Error toggling rink status:', err)
    }
  }

  const handleDeleteRink = async (rink: RinkData) => {
    const totalData = rink.stats.submissions + rink.stats.scheduleEntries
    const message = totalData > 0
      ? `This rink has ${totalData} associated records. It will be deactivated instead of deleted. Continue?`
      : `Are you sure you want to delete "${rink.name}"?`

    if (!confirm(message)) return

    try {
      const response = await fetch(`/api/settings/rinks/${rink.id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchRinks()
      }
    } catch (err) {
      console.error('Error deleting rink:', err)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-gray-500">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Facility Settings</h2>
          <p className="text-sm text-gray-500">Configure your facility preferences and integrations</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
            <button onClick={() => setError('')} className="float-right text-red-500">&times;</button>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-6 overflow-x-auto">
            {[
              { id: 'general', label: 'General' },
              { id: 'rinks', label: 'Rinks' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'retention', label: 'Data Retention' },
              { id: 'airQuality', label: 'Air Quality' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`pb-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && facility && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
              <input
                type="text"
                value={facility.name}
                onChange={(e) => setFacility({ ...facility, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                value={facility.address}
                onChange={(e) => setFacility({ ...facility, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={facility.city}
                  onChange={(e) => setFacility({ ...facility, city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={facility.state}
                  onChange={(e) => setFacility({ ...facility, state: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                <input
                  type="text"
                  value={facility.zipCode}
                  onChange={(e) => setFacility({ ...facility, zipCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={facility.country}
                  onChange={(e) => setFacility({ ...facility, country: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={facility.timezone}
                onChange={(e) => setFacility({ ...facility, timezone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Rinks Tab */}
        {activeTab === 'rinks' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => openRinkModal()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Rink
              </button>
            </div>

            {rinks.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No rinks configured. Add your first rink to get started.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Rink</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Dimensions</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ice Depth</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rinks.map(rink => (
                      <tr key={rink.id} className={`hover:bg-gray-50 ${!rink.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{rink.name}</div>
                          <div className="text-xs text-gray-500 capitalize">{rink.surfaceType}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {rink.dimensions || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            rink.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {rink.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {rink.hasIceDepthConfig ? (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                              {rink.iceDepthPreset || 'Custom'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Not configured</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openRinkModal(rink)}
                            className="text-blue-600 hover:text-blue-800 text-sm mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleRinkStatus(rink)}
                            className={`text-sm mr-3 ${
                              rink.isActive
                                ? 'text-orange-600 hover:text-orange-800'
                                : 'text-green-600 hover:text-green-800'
                            }`}
                          >
                            {rink.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteRink(rink)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && settings && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">SMS Notifications</h3>
                <p className="text-sm text-gray-500">Enable SMS alerts for schedule changes and emergencies</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.smsEnabled}
                  onChange={(e) => setSettings({ ...settings, smsEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.smsEnabled && (
              <>
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMS Provider</label>
                  <select
                    value={settings.smsProvider || ''}
                    onChange={(e) => setSettings({ ...settings, smsProvider: e.target.value || null })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a provider...</option>
                    {SMS_PROVIDERS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMS From Number</label>
                  <input
                    type="text"
                    value={settings.smsFromNumber || ''}
                    onChange={(e) => setSettings({ ...settings, smsFromNumber: e.target.value || null })}
                    placeholder="+1234567890"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Your SMS provider phone number</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quiet Hours Start</label>
                    <input
                      type="time"
                      value={settings.smsQuietHoursStart || ''}
                      onChange={(e) => setSettings({ ...settings, smsQuietHoursStart: e.target.value || null })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quiet Hours End</label>
                    <input
                      type="time"
                      value={settings.smsQuietHoursEnd || ''}
                      onChange={(e) => setSettings({ ...settings, smsQuietHoursEnd: e.target.value || null })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Non-critical messages will not be sent during quiet hours</p>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="smsCriticalOverride"
                    checked={settings.smsCriticalOverride}
                    onChange={(e) => setSettings({ ...settings, smsCriticalOverride: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="smsCriticalOverride" className="text-sm text-gray-700">
                    Allow critical alerts to bypass quiet hours
                  </label>
                </div>
              </>
            )}

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Data Retention Tab */}
        {activeTab === 'retention' && settings && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-1">Data Retention Policies</h3>
              <p className="text-sm text-gray-500">Configure how long different types of data are retained. Set to 0 for indefinite retention.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'iceDepthRetention', label: 'Ice Depth Readings' },
                { key: 'iceOpsRetention', label: 'Ice Operations Logs' },
                { key: 'refrigerationRetention', label: 'Refrigeration Data' },
                { key: 'airQualityRetention', label: 'Air Quality Readings' },
                { key: 'incidentRetention', label: 'Incident Reports' },
                { key: 'scheduleRetention', label: 'Schedule History' },
                { key: 'checklistRetention', label: 'Checklist Records' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={settings[key as keyof SettingsData] as number}
                      onChange={(e) => setSettings({
                        ...settings,
                        [key]: parseInt(e.target.value) || 0
                      })}
                      className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-500">days</span>
                    {(settings[key as keyof SettingsData] as number) === 0 && (
                      <span className="text-xs text-blue-600">(indefinite)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Air Quality Tab */}
        {activeTab === 'airQuality' && settings && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Air Quality Alerts</h3>
                <p className="text-sm text-gray-500">Configure thresholds for CO and NO2 monitoring</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableAirQualityAlerts}
                  onChange={(e) => setSettings({ ...settings, enableAirQualityAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.enableAirQualityAlerts && (
              <>
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Carbon Monoxide (CO) Thresholds</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Warning Level</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={settings.coWarningPpm}
                          onChange={(e) => setSettings({ ...settings, coWarningPpm: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">ppm</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Evacuation Level</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={settings.coEvacuationPpm}
                          onChange={(e) => setSettings({ ...settings, coEvacuationPpm: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">ppm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Nitrogen Dioxide (NO2) Thresholds</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Warning Level</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={settings.no2WarningPpm}
                          onChange={(e) => setSettings({ ...settings, no2WarningPpm: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">ppm</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Evacuation Level</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={settings.no2EvacuationPpm}
                          onChange={(e) => setSettings({ ...settings, no2EvacuationPpm: parseFloat(e.target.value) || 0 })}
                          className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">ppm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> These thresholds are based on EPA guidelines. Consult local regulations
                    for specific requirements in your jurisdiction.
                  </p>
                </div>
              </>
            )}

            <div className="pt-4 border-t flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Rink Modal */}
        {showRinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRink ? 'Edit Rink' : 'Add New Rink'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rink Name *</label>
                  <input
                    type="text"
                    value={rinkForm.name}
                    onChange={(e) => setRinkForm({ ...rinkForm, name: e.target.value })}
                    placeholder="e.g., Main Rink, Studio A"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={rinkForm.dimensions}
                    onChange={(e) => setRinkForm({ ...rinkForm, dimensions: e.target.value })}
                    placeholder="e.g., 200x85, Olympic"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Surface Type</label>
                  <select
                    value={rinkForm.surfaceType}
                    onChange={(e) => setRinkForm({ ...rinkForm, surfaceType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ice">Ice</option>
                    <option value="inline">Inline/Roller</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
                <button
                  onClick={() => setShowRinkModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRink}
                  disabled={saving || !rinkForm.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingRink ? 'Update Rink' : 'Create Rink'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
