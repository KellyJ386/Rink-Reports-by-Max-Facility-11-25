'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'

interface SMSData {
  smsEnabled: boolean
  smsProvider: 'twilio' | 'messagebird' | 'vonage' | null
  smsAccountSid: string | null
  smsAuthToken: string | null
  smsFromNumber: string | null
  smsQuietHoursStart: string | null
  smsQuietHoursEnd: string | null
  smsCriticalOverride: boolean
}

interface SMSSettingsProps {
  initialData: SMSData & { hasSmsCredentials?: boolean }
  onSave: (data: Partial<SMSData>) => Promise<void>
  isLoading?: boolean
}

export default function SMSSettings({
  initialData,
  onSave,
  isLoading = false,
}: SMSSettingsProps) {
  const [showCredentials, setShowCredentials] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { isDirty },
  } = useForm<SMSData>({
    defaultValues: {
      smsEnabled: initialData.smsEnabled,
      smsProvider: initialData.smsProvider,
      smsAccountSid: '',
      smsAuthToken: '',
      smsFromNumber: initialData.smsFromNumber || '',
      smsQuietHoursStart: initialData.smsQuietHoursStart || '',
      smsQuietHoursEnd: initialData.smsQuietHoursEnd || '',
      smsCriticalOverride: initialData.smsCriticalOverride,
    },
  })

  const smsEnabled = watch('smsEnabled')
  const provider = watch('smsProvider')

  const onSubmit = (data: SMSData) => {
    // Only include credentials if they were modified
    const submitData: Partial<SMSData> = {
      smsEnabled: data.smsEnabled,
      smsProvider: data.smsProvider,
      smsFromNumber: data.smsFromNumber || null,
      smsQuietHoursStart: data.smsQuietHoursStart || null,
      smsQuietHoursEnd: data.smsQuietHoursEnd || null,
      smsCriticalOverride: data.smsCriticalOverride,
    }

    // Only include credentials if provided
    if (data.smsAccountSid) {
      submitData.smsAccountSid = data.smsAccountSid
    }
    if (data.smsAuthToken) {
      submitData.smsAuthToken = data.smsAuthToken
    }

    onSave(submitData)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-medium text-gray-900">SMS Notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure SMS notifications for critical alerts and emergencies.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between py-4 border-b">
            <div>
              <label htmlFor="smsEnabled" className="text-sm font-medium text-gray-900">
                Enable SMS Notifications
              </label>
              <p className="text-sm text-gray-500">
                Send SMS alerts for critical events
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                id="smsEnabled"
                {...register('smsEnabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {smsEnabled && (
            <>
              {/* Provider Selection */}
              <div>
                <label htmlFor="smsProvider" className="block text-sm font-medium text-gray-700">
                  SMS Provider
                </label>
                <select
                  id="smsProvider"
                  {...register('smsProvider')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select a provider</option>
                  <option value="twilio">Twilio</option>
                  <option value="messagebird">MessageBird</option>
                  <option value="vonage">Vonage (Nexmo)</option>
                </select>
              </div>

              {provider && (
                <>
                  {/* API Credentials */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">API Credentials</h4>
                        <p className="text-xs text-gray-500">
                          {initialData.hasSmsCredentials
                            ? 'Credentials are configured. Enter new values to update.'
                            : 'Enter your API credentials to enable SMS.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCredentials(!showCredentials)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {showCredentials ? 'Hide' : 'Show'} Credentials
                      </button>
                    </div>

                    {showCredentials && (
                      <div className="space-y-4">
                        <div>
                          <label
                            htmlFor="smsAccountSid"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {provider === 'twilio' ? 'Account SID' : 'API Key'}
                          </label>
                          <input
                            type="text"
                            id="smsAccountSid"
                            {...register('smsAccountSid')}
                            placeholder={initialData.hasSmsCredentials ? '••••••••' : 'Enter API key'}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="smsAuthToken"
                            className="block text-sm font-medium text-gray-700"
                          >
                            {provider === 'twilio' ? 'Auth Token' : 'API Secret'}
                          </label>
                          <input
                            type="password"
                            id="smsAuthToken"
                            {...register('smsAuthToken')}
                            placeholder={initialData.hasSmsCredentials ? '••••••••' : 'Enter API secret'}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* From Number */}
                  <div>
                    <label htmlFor="smsFromNumber" className="block text-sm font-medium text-gray-700">
                      From Number
                    </label>
                    <input
                      type="tel"
                      id="smsFromNumber"
                      {...register('smsFromNumber')}
                      placeholder="+1234567890"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      The phone number that SMS messages will be sent from
                    </p>
                  </div>

                  {/* Quiet Hours */}
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Quiet Hours</h4>
                    <p className="text-xs text-gray-500 mb-4">
                      Non-critical SMS notifications will not be sent during quiet hours.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="smsQuietHoursStart"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Start Time
                        </label>
                        <input
                          type="time"
                          id="smsQuietHoursStart"
                          {...register('smsQuietHoursStart')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="smsQuietHoursEnd"
                          className="block text-sm font-medium text-gray-700"
                        >
                          End Time
                        </label>
                        <input
                          type="time"
                          id="smsQuietHoursEnd"
                          {...register('smsQuietHoursEnd')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center">
                      <input
                        type="checkbox"
                        id="smsCriticalOverride"
                        {...register('smsCriticalOverride')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="smsCriticalOverride"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Allow critical alerts to override quiet hours
                      </label>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save SMS Settings'}
        </button>
      </div>
    </form>
  )
}
