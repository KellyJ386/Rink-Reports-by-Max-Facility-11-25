'use client'

import { useState, useEffect } from 'react'
import Tabs from '@/components/ui/Tabs'
import RetentionSettings from '@/components/admin/RetentionSettings'
import AirQualityThresholds from '@/components/admin/AirQualityThresholds'
import SMSSettings from '@/components/admin/SMSSettings'

interface FacilitySettings {
  id: string
  // Retention
  iceDepthRetention: number
  iceOpsRetention: number
  refrigerationRetention: number
  airQualityRetention: number
  incidentRetention: number
  scheduleRetention: number
  checklistRetention: number
  // Air Quality
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
  enableAirQualityAlerts: boolean
  // SMS
  smsEnabled: boolean
  smsProvider: 'twilio' | 'messagebird' | 'vonage' | null
  smsFromNumber: string | null
  smsQuietHoursStart: string | null
  smsQuietHoursEnd: string | null
  smsCriticalOverride: boolean
  hasSmsCredentials: boolean
}

interface Facility {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  timezone: string
}

export default function SettingsPage() {
  const [facility, setFacility] = useState<Facility | null>(null)
  const [settings, setSettings] = useState<FacilitySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }
      const data = await response.json()
      setFacility(data.facility)
      setSettings(data.settings)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSettings = async (section: string, data: Record<string, unknown>) => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, data }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }

      setSuccessMessage('Settings saved successfully')
      fetchSettings() // Refresh settings
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load settings</p>
      </div>
    )
  }

  const tabs = [
    {
      id: 'general',
      label: 'General',
      content: (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Facility Information</h3>
          {facility && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Name</label>
                <p className="mt-1 text-sm text-gray-900">{facility.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Timezone</label>
                <p className="mt-1 text-sm text-gray-900">{facility.timezone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500">Address</label>
                <p className="mt-1 text-sm text-gray-900">
                  {facility.address}, {facility.city}, {facility.state} {facility.zipCode}, {facility.country}
                </p>
              </div>
            </div>
          )}
          <p className="mt-4 text-sm text-gray-500">
            Contact support to update facility information.
          </p>
        </div>
      ),
    },
    {
      id: 'retention',
      label: 'Data Retention',
      content: (
        <RetentionSettings
          initialData={{
            iceDepthRetention: settings.iceDepthRetention,
            iceOpsRetention: settings.iceOpsRetention,
            refrigerationRetention: settings.refrigerationRetention,
            airQualityRetention: settings.airQualityRetention,
            incidentRetention: settings.incidentRetention,
            scheduleRetention: settings.scheduleRetention,
            checklistRetention: settings.checklistRetention,
          }}
          onSave={(data) => saveSettings('retention', data as unknown as Record<string, unknown>)}
          isLoading={isSaving}
        />
      ),
    },
    {
      id: 'airQuality',
      label: 'Air Quality',
      content: (
        <AirQualityThresholds
          initialData={{
            coWarningPpm: settings.coWarningPpm,
            coEvacuationPpm: settings.coEvacuationPpm,
            no2WarningPpm: settings.no2WarningPpm,
            no2EvacuationPpm: settings.no2EvacuationPpm,
            enableAirQualityAlerts: settings.enableAirQualityAlerts,
          }}
          onSave={(data) => saveSettings('airQuality', data as unknown as Record<string, unknown>)}
          isLoading={isSaving}
        />
      ),
    },
    {
      id: 'sms',
      label: 'SMS',
      content: (
        <SMSSettings
          initialData={{
            smsEnabled: settings.smsEnabled,
            smsProvider: settings.smsProvider,
            smsAccountSid: null,
            smsAuthToken: null,
            smsFromNumber: settings.smsFromNumber,
            smsQuietHoursStart: settings.smsQuietHoursStart,
            smsQuietHoursEnd: settings.smsQuietHoursEnd,
            smsCriticalOverride: settings.smsCriticalOverride,
            hasSmsCredentials: settings.hasSmsCredentials,
          }}
          onSave={(data) => saveSettings('sms', data)}
          isLoading={isSaving}
        />
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Facility Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure data retention, alert thresholds, and notifications
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800">{successMessage}</p>
        </div>
      )}

      <Tabs tabs={tabs} defaultTab="general" />
    </div>
  )
}
