'use client'

import { useState, useEffect } from 'react'

interface Facility {
  id: string
  name: string
  rinks: Rink[]
}

interface Rink {
  id: string
  name: string
}

interface UniversalHeaderData {
  facilityId: string
  rinkId?: string
  dateTime: string
  outsideTemp?: number
  submittedBy: {
    id: string
    name: string
  }
}

interface UniversalHeaderProps {
  facilities: Facility[]
  currentUser: { id: string; name: string }
  initialData?: Partial<UniversalHeaderData>
  onChange: (data: UniversalHeaderData) => void
  requireRink?: boolean
  showWeather?: boolean
  disabled?: boolean
}

export function UniversalHeader({
  facilities,
  currentUser,
  initialData,
  onChange,
  requireRink = true,
  showWeather = true,
  disabled = false,
}: UniversalHeaderProps) {
  const [facilityId, setFacilityId] = useState(initialData?.facilityId || '')
  const [rinkId, setRinkId] = useState(initialData?.rinkId || '')
  const [dateTime, setDateTime] = useState(
    initialData?.dateTime || new Date().toISOString().slice(0, 16)
  )
  const [outsideTemp, setOutsideTemp] = useState<number | undefined>(initialData?.outsideTemp)
  const [fetchingWeather, setFetchingWeather] = useState(false)

  // Get rinks for selected facility
  const selectedFacility = facilities.find((f) => f.id === facilityId)
  const rinks = selectedFacility?.rinks || []

  // Auto-select first facility if only one
  useEffect(() => {
    if (facilities.length === 1 && !facilityId) {
      setFacilityId(facilities[0].id)
    }
  }, [facilities, facilityId])

  // Auto-select first rink if only one
  useEffect(() => {
    if (rinks.length === 1 && !rinkId) {
      setRinkId(rinks[0].id)
    } else if (!rinks.find((r) => r.id === rinkId)) {
      setRinkId('')
    }
  }, [rinks, rinkId])

  // Emit changes
  useEffect(() => {
    onChange({
      facilityId,
      rinkId: rinkId || undefined,
      dateTime,
      outsideTemp,
      submittedBy: currentUser,
    })
  }, [facilityId, rinkId, dateTime, outsideTemp, currentUser, onChange])

  // Fetch weather automatically
  const fetchWeather = async () => {
    if (!showWeather) return

    setFetchingWeather(true)
    try {
      // Try to get user's location
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
        })

        const { latitude, longitude } = position.coords
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&temperature_unit=fahrenheit`
        )

        if (response.ok) {
          const data = await response.json()
          setOutsideTemp(Math.round(data.current.temperature_2m))
        }
      }
    } catch (err) {
      console.error('Failed to fetch weather:', err)
    } finally {
      setFetchingWeather(false)
    }
  }

  // Auto-fetch weather on mount
  useEffect(() => {
    if (showWeather && outsideTemp === undefined) {
      fetchWeather()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Report Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Facility Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Facility <span className="text-red-500">*</span>
          </label>
          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            disabled={disabled || facilities.length === 1}
            className="input w-full"
            required
          >
            <option value="">Select facility...</option>
            {facilities.map((facility) => (
              <option key={facility.id} value={facility.id}>
                {facility.name}
              </option>
            ))}
          </select>
        </div>

        {/* Rink Selection */}
        {requireRink && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rink <span className="text-red-500">*</span>
            </label>
            <select
              value={rinkId}
              onChange={(e) => setRinkId(e.target.value)}
              disabled={disabled || !facilityId || rinks.length === 1}
              className="input w-full"
              required
            >
              <option value="">Select rink...</option>
              {rinks.map((rink) => (
                <option key={rink.id} value={rink.id}>
                  {rink.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Date/Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            disabled={disabled}
            className="input w-full"
            required
          />
        </div>

        {/* Outside Temperature */}
        {showWeather && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outside Temp (°F)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={outsideTemp ?? ''}
                onChange={(e) =>
                  setOutsideTemp(e.target.value ? parseInt(e.target.value) : undefined)
                }
                disabled={disabled}
                className="input flex-1"
                placeholder="--"
              />
              <button
                type="button"
                onClick={fetchWeather}
                disabled={disabled || fetchingWeather}
                className="btn btn-secondary px-3"
                title="Fetch current weather"
              >
                {fetchingWeather ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Submitted by (read-only) */}
      <div className="pt-2 border-t text-sm text-gray-500">
        Submitted by: <span className="font-medium text-gray-700">{currentUser.name}</span>
      </div>
    </div>
  )
}

// Read-only header view for submission display
interface UniversalHeaderViewProps {
  data: {
    facility?: { name: string }
    rink?: { name: string }
    submittedAt: string
    outsideTemp?: number
    submittedBy?: { firstName: string; lastName: string }
  }
}

export function UniversalHeaderView({ data }: UniversalHeaderViewProps) {
  return (
    <div className="bg-gray-50 rounded-lg border p-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Facility:</span>{' '}
          <span className="font-medium">{data.facility?.name || '-'}</span>
        </div>
        {data.rink && (
          <div>
            <span className="text-gray-500">Rink:</span>{' '}
            <span className="font-medium">{data.rink.name}</span>
          </div>
        )}
        <div>
          <span className="text-gray-500">Date:</span>{' '}
          <span className="font-medium">
            {new Date(data.submittedAt).toLocaleString()}
          </span>
        </div>
        {data.outsideTemp !== undefined && (
          <div>
            <span className="text-gray-500">Outside Temp:</span>{' '}
            <span className="font-medium">{data.outsideTemp}°F</span>
          </div>
        )}
        {data.submittedBy && (
          <div>
            <span className="text-gray-500">Submitted by:</span>{' '}
            <span className="font-medium">
              {data.submittedBy.firstName} {data.submittedBy.lastName}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
