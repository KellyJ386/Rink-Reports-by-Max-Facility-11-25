'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/shared'
import { NumberField, CheckboxField, SelectField, TextField } from '@/components/forms/fields'

interface FacilitySettings {
  iceDepthRetention: number
  iceOpsRetention: number
  refrigerationRetention: number
  airQualityRetention: number
  incidentRetention: number
  scheduleRetention: number
  checklistRetention: number
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
  enableAirQualityAlerts: boolean
  smsEnabled: boolean
  smsProvider: string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<FacilitySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        setSettings(data.settings || getDefaultSettings())
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setSettings(getDefaultSettings())
        setLoading(false)
      })
  }, [])

  const getDefaultSettings = (): FacilitySettings => ({
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
  })

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' })
      } else {
        throw new Error('Failed to save')
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = <K extends keyof FacilitySettings>(
    key: K,
    value: FacilitySettings[K]
  ) => {
    if (settings) {
      setSettings({ ...settings, [key]: value })
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Facility Settings"
        description="Configure facility-wide settings and preferences"
        backHref="/dashboard/admin"
        backLabel="Back to Admin"
      />

      <div className="space-y-6">
        {/* Air Quality Thresholds */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Air Quality Thresholds</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure warning and evacuation thresholds for air quality monitoring.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-3">Carbon Monoxide (CO)</h3>
              <div className="space-y-3">
                <NumberField
                  id="coWarningPpm"
                  label="Warning Level"
                  value={settings.coWarningPpm}
                  onChange={(val) => updateSetting('coWarningPpm', val || 20)}
                  unit="ppm"
                  min={0}
                  max={100}
                  helperText="Default: 20 ppm"
                />
                <NumberField
                  id="coEvacuationPpm"
                  label="Evacuation Level"
                  value={settings.coEvacuationPpm}
                  onChange={(val) => updateSetting('coEvacuationPpm', val || 83)}
                  unit="ppm"
                  min={0}
                  max={200}
                  helperText="Default: 83 ppm (OSHA limit)"
                />
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <h3 className="font-medium mb-3">Nitrogen Dioxide (NO₂)</h3>
              <div className="space-y-3">
                <NumberField
                  id="no2WarningPpm"
                  label="Warning Level"
                  value={settings.no2WarningPpm}
                  onChange={(val) => updateSetting('no2WarningPpm', val || 0.3)}
                  unit="ppm"
                  min={0}
                  max={5}
                  step={0.01}
                  helperText="Default: 0.3 ppm"
                />
                <NumberField
                  id="no2EvacuationPpm"
                  label="Evacuation Level"
                  value={settings.no2EvacuationPpm}
                  onChange={(val) => updateSetting('no2EvacuationPpm', val || 2.0)}
                  unit="ppm"
                  min={0}
                  max={10}
                  step={0.1}
                  helperText="Default: 2.0 ppm"
                />
              </div>
            </div>
          </div>

          <div className="mt-4">
            <CheckboxField
              id="enableAirQualityAlerts"
              label="Enable Air Quality Alerts"
              description="Send notifications when thresholds are exceeded"
              checked={settings.enableAirQualityAlerts}
              onChange={(val) => updateSetting('enableAirQualityAlerts', val)}
            />
          </div>
        </div>

        {/* Data Retention */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Data Retention</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure how long to retain data for each module (in days). Set to 0 for indefinite retention.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'iceDepthRetention', label: 'Ice Depth' },
              { key: 'iceOpsRetention', label: 'Ice Operations' },
              { key: 'refrigerationRetention', label: 'Refrigeration' },
              { key: 'airQualityRetention', label: 'Air Quality' },
              { key: 'incidentRetention', label: 'Incidents' },
              { key: 'scheduleRetention', label: 'Schedule' },
              { key: 'checklistRetention', label: 'Checklists' },
            ].map((item) => (
              <NumberField
                key={item.key}
                id={item.key}
                label={item.label}
                value={settings[item.key as keyof FacilitySettings] as number}
                onChange={(val) =>
                  updateSetting(item.key as keyof FacilitySettings, val || 0 as any)
                }
                unit="days"
                min={0}
                step={1}
              />
            ))}
          </div>

          <p className="text-xs text-gray-400 mt-4">
            * Incident retention defaults to 7 years (2555 days) for compliance. Other modules default to 3 years (1095 days).
          </p>
        </div>

        {/* SMS Configuration */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">SMS Notifications</h2>
          <p className="text-sm text-gray-500 mb-4">
            Configure SMS notifications for critical alerts.
          </p>

          <CheckboxField
            id="smsEnabled"
            label="Enable SMS Notifications"
            description="Send SMS alerts for critical events like evacuations and emergencies"
            checked={settings.smsEnabled}
            onChange={(val) => updateSetting('smsEnabled', val)}
          />

          {settings.smsEnabled && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                SMS configuration requires additional setup. Contact your administrator to configure
                Twilio or another SMS provider.
              </p>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
