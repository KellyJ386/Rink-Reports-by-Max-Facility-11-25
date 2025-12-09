'use client'

import { useEffect, useState } from 'react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { SelectField, NumberField, DateTimeField } from './fields'

interface Rink {
  id: string
  name: string
}

interface UniversalHeaderProps {
  rinks: Rink[]
  register: UseFormRegister<any>
  errors: FieldErrors
  defaultRinkId?: string
  showTemperature?: boolean
  showWeather?: boolean
}

export interface UniversalHeaderData {
  rinkId: string
  submittedAt: string
  outsideTemp?: number
  outsideTempUnit: 'F' | 'C'
  weatherCondition?: string
}

export default function UniversalHeader({
  rinks,
  register,
  errors,
  defaultRinkId,
  showTemperature = true,
  showWeather = false,
}: UniversalHeaderProps) {
  const [currentTime, setCurrentTime] = useState<string>('')

  // Set current datetime on mount
  useEffect(() => {
    const now = new Date()
    const localISOTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setCurrentTime(localISOTime)
  }, [])

  const rinkOptions = rinks.map((r) => ({ value: r.id, label: r.name }))

  const weatherOptions = [
    { value: 'clear', label: 'Clear' },
    { value: 'cloudy', label: 'Cloudy' },
    { value: 'rainy', label: 'Rainy' },
    { value: 'snowy', label: 'Snowy' },
    { value: 'foggy', label: 'Foggy' },
    { value: 'windy', label: 'Windy' },
  ]

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Report Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Rink Selection */}
        <SelectField
          id="rinkId"
          label="Rink"
          options={rinkOptions}
          required
          register={register}
          error={errors.rinkId as any}
          placeholder="Select rink"
        />

        {/* Date/Time */}
        <DateTimeField
          id="submittedAt"
          label="Date & Time"
          type="datetime-local"
          required
          register={register}
          error={errors.submittedAt as any}
          value={currentTime}
        />

        {/* Outside Temperature */}
        {showTemperature && (
          <div className="flex gap-2">
            <div className="flex-1">
              <NumberField
                id="outsideTemp"
                label="Outside Temp"
                placeholder="Enter temp"
                register={register}
                error={errors.outsideTemp as any}
                min={-50}
                max={150}
              />
            </div>
            <div className="w-20">
              <SelectField
                id="outsideTempUnit"
                label="Unit"
                options={[
                  { value: 'F', label: '°F' },
                  { value: 'C', label: '°C' },
                ]}
                register={register}
                error={errors.outsideTempUnit as any}
              />
            </div>
          </div>
        )}

        {/* Weather Condition */}
        {showWeather && (
          <SelectField
            id="weatherCondition"
            label="Weather"
            options={weatherOptions}
            register={register}
            error={errors.weatherCondition as any}
            placeholder="Select condition"
          />
        )}
      </div>
    </div>
  )
}

// Read-only version for viewing submissions
interface UniversalHeaderViewProps {
  rinkName: string
  submittedAt: string | Date
  outsideTemp?: number
  outsideTempUnit?: string
  submittedBy?: string
}

export function UniversalHeaderView({
  rinkName,
  submittedAt,
  outsideTemp,
  outsideTempUnit = 'F',
  submittedBy,
}: UniversalHeaderViewProps) {
  const formattedDate = new Date(submittedAt).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-gray-500">Rink</p>
          <p className="font-medium">{rinkName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Date & Time</p>
          <p className="font-medium">{formattedDate}</p>
        </div>
        {outsideTemp !== undefined && (
          <div>
            <p className="text-xs text-gray-500">Outside Temperature</p>
            <p className="font-medium">
              {outsideTemp}°{outsideTempUnit}
            </p>
          </div>
        )}
        {submittedBy && (
          <div>
            <p className="text-xs text-gray-500">Submitted By</p>
            <p className="font-medium">{submittedBy}</p>
          </div>
        )}
      </div>
    </div>
  )
}
