'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface FacilitySettings {
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
  enableAirQualityAlerts: boolean
  iceDepthRetention: number
  iceOpsRetention: number
  refrigerationRetention: number
  airQualityRetention: number
  incidentRetention: number
  scheduleRetention: number
  checklistRetention: number
  smsEnabled: boolean
  smsProvider: string | null
  smsFromNumber: string | null
  smsQuietHoursStart: string | null
  smsQuietHoursEnd: string | null
  smsCriticalOverride: boolean
}

interface Facility {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  timezone: string
}

export default function SettingsPage() {
  const [facility, setFacility] = useState<Facility | null>(null)
  const [settings, setSettings] = useState<FacilitySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'facility' | 'airQuality' | 'retention' | 'sms'>('facility')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (!res.ok) throw new Error('Failed to fetch settings')
      const data = await res.json()
      setFacility(data.facility)
      setSettings(data.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updates: Record<string, unknown>) => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      const data = await res.json()
      setFacility(data.facility)
      setSettings(data.settings)
      setSuccess('Settings saved successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Facility Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure facility information and system settings
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: 'facility', label: 'Facility Info' },
          { key: 'airQuality', label: 'Air Quality' },
          { key: 'retention', label: 'Data Retention' },
          { key: 'sms', label: 'SMS Alerts' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Facility Info Tab */}
      {activeTab === 'facility' && facility && (
        <FacilityForm facility={facility} onSave={handleSave} saving={saving} />
      )}

      {/* Air Quality Tab */}
      {activeTab === 'airQuality' && settings && (
        <AirQualityForm settings={settings} onSave={handleSave} saving={saving} />
      )}

      {/* Data Retention Tab */}
      {activeTab === 'retention' && settings && (
        <RetentionForm settings={settings} onSave={handleSave} saving={saving} />
      )}

      {/* SMS Tab */}
      {activeTab === 'sms' && settings && (
        <SMSForm settings={settings} onSave={handleSave} saving={saving} />
      )}

      {/* Quick Links */}
      <div className="mt-8 pt-8 border-t">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/dashboard/admin/users" className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium text-gray-900">User Management</h3>
            <p className="text-sm text-gray-500">Manage staff accounts</p>
          </Link>
          <Link href="/dashboard/admin/roles" className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium text-gray-900">Role Management</h3>
            <p className="text-sm text-gray-500">Configure permissions</p>
          </Link>
          <Link href="/dashboard/admin/rinks" className="card p-4 hover:shadow-md transition-shadow">
            <h3 className="font-medium text-gray-900">Rink Configuration</h3>
            <p className="text-sm text-gray-500">Manage rink settings</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

function FacilityForm({ facility, onSave, saving }: { facility: Facility; onSave: (data: Record<string, unknown>) => void; saving: boolean }) {
  const [data, setData] = useState({
    facilityName: facility.name,
    facilityAddress: facility.address,
    facilityCity: facility.city,
    facilityState: facility.state,
    facilityZipCode: facility.zipCode,
    facilityTimezone: facility.timezone,
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(data) }} className="card p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Facility Name</label>
        <input type="text" value={data.facilityName} onChange={(e) => setData({ ...data, facilityName: e.target.value })} className="input w-full max-w-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
        <input type="text" value={data.facilityAddress} onChange={(e) => setData({ ...data, facilityAddress: e.target.value })} className="input w-full max-w-md" />
      </div>
      <div className="grid grid-cols-3 gap-4 max-w-md">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input type="text" value={data.facilityCity} onChange={(e) => setData({ ...data, facilityCity: e.target.value })} className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <input type="text" value={data.facilityState} onChange={(e) => setData({ ...data, facilityState: e.target.value })} className="input w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
          <input type="text" value={data.facilityZipCode} onChange={(e) => setData({ ...data, facilityZipCode: e.target.value })} className="input w-full" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
        <select value={data.facilityTimezone} onChange={(e) => setData({ ...data, facilityTimezone: e.target.value })} className="input max-w-md">
          <option value="America/New_York">Eastern Time</option>
          <option value="America/Chicago">Central Time</option>
          <option value="America/Denver">Mountain Time</option>
          <option value="America/Los_Angeles">Pacific Time</option>
        </select>
      </div>
      <div className="pt-4">
        <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </form>
  )
}

function AirQualityForm({ settings, onSave, saving }: { settings: FacilitySettings; onSave: (data: Record<string, unknown>) => void; saving: boolean }) {
  const [data, setData] = useState({
    coWarningPpm: settings.coWarningPpm,
    coEvacuationPpm: settings.coEvacuationPpm,
    no2WarningPpm: settings.no2WarningPpm,
    no2EvacuationPpm: settings.no2EvacuationPpm,
    enableAirQualityAlerts: settings.enableAirQualityAlerts,
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(data) }} className="card p-6 space-y-6">
      <div className="flex items-center gap-2">
        <input type="checkbox" id="enableAlerts" checked={data.enableAirQualityAlerts} onChange={(e) => setData({ ...data, enableAirQualityAlerts: e.target.checked })} className="w-4 h-4" />
        <label htmlFor="enableAlerts" className="font-medium text-gray-900">Enable Air Quality Alerts</label>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Carbon Monoxide (CO)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warning Level (ppm)</label>
            <input type="number" step="0.1" value={data.coWarningPpm} onChange={(e) => setData({ ...data, coWarningPpm: parseFloat(e.target.value) })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evacuation Level (ppm)</label>
            <input type="number" step="0.1" value={data.coEvacuationPpm} onChange={(e) => setData({ ...data, coEvacuationPpm: parseFloat(e.target.value) })} className="input w-full" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900">Nitrogen Dioxide (NO2)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warning Level (ppm)</label>
            <input type="number" step="0.01" value={data.no2WarningPpm} onChange={(e) => setData({ ...data, no2WarningPpm: parseFloat(e.target.value) })} className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Evacuation Level (ppm)</label>
            <input type="number" step="0.01" value={data.no2EvacuationPpm} onChange={(e) => setData({ ...data, no2EvacuationPpm: parseFloat(e.target.value) })} className="input w-full" />
          </div>
        </div>
      </div>
      <div className="pt-4">
        <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </form>
  )
}

function RetentionForm({ settings, onSave, saving }: { settings: FacilitySettings; onSave: (data: Record<string, unknown>) => void; saving: boolean }) {
  const [data, setData] = useState({
    iceDepthRetention: settings.iceDepthRetention,
    iceOpsRetention: settings.iceOpsRetention,
    refrigerationRetention: settings.refrigerationRetention,
    airQualityRetention: settings.airQualityRetention,
    incidentRetention: settings.incidentRetention,
    scheduleRetention: settings.scheduleRetention,
    checklistRetention: settings.checklistRetention,
  })

  const modules = [
    { key: 'iceDepthRetention', label: 'Ice Depth' },
    { key: 'iceOpsRetention', label: 'Ice Operations' },
    { key: 'refrigerationRetention', label: 'Refrigeration' },
    { key: 'airQualityRetention', label: 'Air Quality' },
    { key: 'incidentRetention', label: 'Incidents' },
    { key: 'scheduleRetention', label: 'Schedule' },
    { key: 'checklistRetention', label: 'Checklists' },
  ]

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(data) }} className="card p-6">
      <p className="text-gray-600 mb-6">Set how long to retain data for each module. Enter 0 for indefinite retention.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <div key={mod.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{mod.label}</label>
            <div className="flex items-center gap-2">
              <input type="number" value={data[mod.key as keyof typeof data]} onChange={(e) => setData({ ...data, [mod.key]: parseInt(e.target.value) || 0 })} className="input w-24" />
              <span className="text-gray-500">days</span>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-6">
        <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </form>
  )
}

function SMSForm({ settings, onSave, saving }: { settings: FacilitySettings; onSave: (data: Record<string, unknown>) => void; saving: boolean }) {
  const [data, setData] = useState({
    smsEnabled: settings.smsEnabled,
    smsProvider: settings.smsProvider || '',
    smsFromNumber: settings.smsFromNumber || '',
    smsQuietHoursStart: settings.smsQuietHoursStart || '',
    smsQuietHoursEnd: settings.smsQuietHoursEnd || '',
    smsCriticalOverride: settings.smsCriticalOverride,
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(data) }} className="card p-6 space-y-6">
      <div className="flex items-center gap-2">
        <input type="checkbox" id="smsEnabled" checked={data.smsEnabled} onChange={(e) => setData({ ...data, smsEnabled: e.target.checked })} className="w-4 h-4" />
        <label htmlFor="smsEnabled" className="font-medium text-gray-900">Enable SMS Notifications</label>
      </div>
      {data.smsEnabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
              <select value={data.smsProvider} onChange={(e) => setData({ ...data, smsProvider: e.target.value })} className="input w-full">
                <option value="">Select provider...</option>
                <option value="twilio">Twilio</option>
                <option value="messagebird">MessageBird</option>
                <option value="vonage">Vonage</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Number</label>
              <input type="tel" value={data.smsFromNumber} onChange={(e) => setData({ ...data, smsFromNumber: e.target.value })} className="input w-full" placeholder="+1234567890" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiet Hours Start</label>
              <input type="time" value={data.smsQuietHoursStart} onChange={(e) => setData({ ...data, smsQuietHoursStart: e.target.value })} className="input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quiet Hours End</label>
              <input type="time" value={data.smsQuietHoursEnd} onChange={(e) => setData({ ...data, smsQuietHoursEnd: e.target.value })} className="input w-full" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="criticalOverride" checked={data.smsCriticalOverride} onChange={(e) => setData({ ...data, smsCriticalOverride: e.target.checked })} className="w-4 h-4" />
            <label htmlFor="criticalOverride" className="text-gray-700">Allow critical alerts during quiet hours</label>
          </div>
        </>
      )}
      <div className="pt-4">
        <button type="submit" disabled={saving} className="btn btn-primary">{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>
    </form>
  )
}
