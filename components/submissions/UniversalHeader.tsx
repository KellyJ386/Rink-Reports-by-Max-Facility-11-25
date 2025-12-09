'use client'

import { useState, useEffect } from 'react'

interface Rink {
  id: string
  name: string
  facilityId: string
}

export interface HeaderData {
  rinkId: string
  submittedAt: string
  outsideTemp: number | null
  outsideTempUnit: 'F' | 'C'
}

interface UniversalHeaderProps {
  value: HeaderData
  onChange: (data: HeaderData) => void
  rinks: Rink[]
  disabled?: boolean
  showRinkSelector?: boolean
}

export default function UniversalHeader({
  value,
  onChange,
  rinks,
  disabled = false,
  showRinkSelector = true,
}: UniversalHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const handleDateTimeChange = (dateTime: string) => {
    onChange({ ...value, submittedAt: dateTime })
  }

  const handleRinkChange = (rinkId: string) => {
    onChange({ ...value, rinkId })
  }

  const handleTempChange = (temp: string) => {
    const parsed = parseFloat(temp)
    onChange({ ...value, outsideTemp: isNaN(parsed) ? null : parsed })
  }

  const handleTempUnitChange = (unit: 'F' | 'C') => {
    // Convert temperature when switching units
    if (value.outsideTemp !== null) {
      const converted =
        unit === 'C'
          ? ((value.outsideTemp - 32) * 5) / 9
          : (value.outsideTemp * 9) / 5 + 32
      onChange({
        ...value,
        outsideTemp: Math.round(converted * 10) / 10,
        outsideTempUnit: unit,
      })
    } else {
      onChange({ ...value, outsideTempUnit: unit })
    }
  }

  // Format date for datetime-local input
  const formatDateTimeLocal = (dateString: string) => {
    const date = new Date(dateString)
    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60000)
    return localDate.toISOString().slice(0, 16)
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-sm font-semibold text-blue-800">Report Header</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Rink Selector */}
        {showRinkSelector && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rink <span className="text-red-500">*</span>
            </label>
            <select
              value={value.rinkId}
              onChange={(e) => handleRinkChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select a rink...</option>
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
            value={formatDateTimeLocal(value.submittedAt)}
            onChange={(e) => handleDateTimeChange(new Date(e.target.value).toISOString())}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {/* Outside Temperature */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Outside Temperature
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={value.outsideTemp ?? ''}
              onChange={(e) => handleTempChange(e.target.value)}
              placeholder="--"
              disabled={disabled}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => handleTempUnitChange('F')}
                disabled={disabled}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  value.outsideTempUnit === 'F'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } disabled:cursor-not-allowed`}
              >
                °F
              </button>
              <button
                type="button"
                onClick={() => handleTempUnitChange('C')}
                disabled={disabled}
                className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                  value.outsideTempUnit === 'C'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                } disabled:cursor-not-allowed`}
              >
                °C
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current time display */}
      <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-gray-500">
        <span>
          Current time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <button
          type="button"
          onClick={() => handleDateTimeChange(new Date().toISOString())}
          disabled={disabled}
          className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Set to now
        </button>
      </div>
    </div>
  )
}

// Export default header data factory
export function createDefaultHeaderData(rinkId = ''): HeaderData {
  return {
    rinkId,
    submittedAt: new Date().toISOString(),
    outsideTemp: null,
    outsideTempUnit: 'F',
  }
}
