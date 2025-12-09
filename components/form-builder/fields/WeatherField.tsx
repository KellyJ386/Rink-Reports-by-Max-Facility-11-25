'use client'

import { useState, useEffect } from 'react'
import type { FieldEditProps, FieldRenderProps, WeatherFieldConfig } from '../types'

interface WeatherData {
  temperature: number
  humidity: number
  conditions: string
  wind: {
    speed: number
    direction: string
  }
  fetchedAt: string
  location?: string
}

// Edit mode component for form builder
export function WeatherFieldEdit({
  field,
  isSelected,
  onSelect,
}: FieldEditProps) {
  return (
    <div
      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 mb-2">
        <WeatherIcon className="w-5 h-5 text-gray-400" />
        <span className="font-medium text-gray-700">{field.label}</span>
        {field.required && <span className="text-red-500">*</span>}
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
            <SunIcon className="w-8 h-8 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-800">--°</div>
            <div className="text-sm text-gray-500">Weather auto-fetch</div>
          </div>
        </div>
      </div>
      {field.helpText && (
        <p className="text-xs text-gray-500 mt-2">{field.helpText}</p>
      )}
    </div>
  )
}

// Render mode component for form submission
export function WeatherFieldRender({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRenderProps) {
  const weatherData = value as WeatherData | null
  const config = field.weatherConfig || {
    autoFetch: true,
    units: 'imperial',
    fields: ['temperature', 'humidity', 'conditions', 'wind'],
  }
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (config.autoFetch && !weatherData && !disabled) {
      fetchWeather()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchWeather = async () => {
    setLoading(true)
    setFetchError(null)

    try {
      // Get location
      let latitude: number | undefined
      let longitude: number | undefined

      if (config.location?.latitude && config.location?.longitude) {
        latitude = config.location.latitude
        longitude = config.location.longitude
      } else if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 10000,
            })
          }
        )
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      }

      if (!latitude || !longitude) {
        throw new Error('Unable to determine location')
      }

      // Fetch weather data from Open-Meteo (free, no API key required)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=${
          config.units === 'imperial' ? 'fahrenheit' : 'celsius'
        }&wind_speed_unit=${config.units === 'imperial' ? 'mph' : 'kmh'}`
      )

      if (!response.ok) {
        throw new Error('Weather service unavailable')
      }

      const data = await response.json()

      const newWeatherData: WeatherData = {
        temperature: data.current.temperature_2m,
        humidity: data.current.relative_humidity_2m,
        conditions: getWeatherCondition(data.current.weather_code),
        wind: {
          speed: data.current.wind_speed_10m,
          direction: getWindDirection(data.current.wind_direction_10m),
        },
        fetchedAt: new Date().toISOString(),
      }

      onChange(newWeatherData)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to fetch weather')
    } finally {
      setLoading(false)
    }
  }

  const formatTemperature = (temp: number) => {
    return `${Math.round(temp)}°${config.units === 'imperial' ? 'F' : 'C'}`
  }

  const formatWindSpeed = (speed: number) => {
    return `${Math.round(speed)} ${config.units === 'imperial' ? 'mph' : 'km/h'}`
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <button
          type="button"
          onClick={fetchWeather}
          disabled={disabled || loading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {loading ? 'Fetching...' : 'Refresh'}
        </button>
      </div>

      {loading && !weatherData && (
        <div className="bg-gray-50 rounded-lg p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-2">Fetching weather data...</p>
        </div>
      )}

      {fetchError && !weatherData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{fetchError}</p>
          <button
            type="button"
            onClick={fetchWeather}
            className="text-sm text-red-600 hover:text-red-800 mt-2"
          >
            Try again
          </button>
        </div>
      )}

      {weatherData && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full shadow flex items-center justify-center">
                <WeatherConditionIcon condition={weatherData.conditions} />
              </div>
              <div>
                {config.fields.includes('temperature') && (
                  <div className="text-3xl font-bold text-gray-800">
                    {formatTemperature(weatherData.temperature)}
                  </div>
                )}
                {config.fields.includes('conditions') && (
                  <div className="text-sm text-gray-600">{weatherData.conditions}</div>
                )}
              </div>
            </div>

            <div className="text-right space-y-1">
              {config.fields.includes('humidity') && (
                <div className="text-sm">
                  <span className="text-gray-500">Humidity:</span>{' '}
                  <span className="font-medium">{weatherData.humidity}%</span>
                </div>
              )}
              {config.fields.includes('wind') && (
                <div className="text-sm">
                  <span className="text-gray-500">Wind:</span>{' '}
                  <span className="font-medium">
                    {formatWindSpeed(weatherData.wind.speed)} {weatherData.wind.direction}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-blue-100 text-xs text-gray-500">
            Updated: {new Date(weatherData.fetchedAt).toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Manual override option */}
      {weatherData && !disabled && (
        <details className="text-sm">
          <summary className="text-gray-500 cursor-pointer hover:text-gray-700">
            Manual override
          </summary>
          <div className="mt-2 grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg">
            {config.fields.includes('temperature') && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Temperature</label>
                <input
                  type="number"
                  value={weatherData.temperature}
                  onChange={(e) =>
                    onChange({
                      ...weatherData,
                      temperature: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="input w-full text-sm"
                />
              </div>
            )}
            {config.fields.includes('humidity') && (
              <div>
                <label className="block text-xs text-gray-600 mb-1">Humidity %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={weatherData.humidity}
                  onChange={(e) =>
                    onChange({
                      ...weatherData,
                      humidity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input w-full text-sm"
                />
              </div>
            )}
          </div>
        </details>
      )}

      {field.helpText && (
        <p className="text-xs text-gray-500">{field.helpText}</p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

// Weather condition code to text mapping (WMO codes)
function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Slight Hail',
    99: 'Thunderstorm with Heavy Hail',
  }
  return conditions[code] || 'Unknown'
}

// Wind direction degrees to compass
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

// Weather condition icon
function WeatherConditionIcon({ condition }: { condition: string }) {
  const lowerCondition = condition.toLowerCase()

  if (lowerCondition.includes('clear') || lowerCondition.includes('sunny')) {
    return <SunIcon className="w-10 h-10 text-yellow-500" />
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <CloudIcon className="w-10 h-10 text-gray-400" />
  }
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return <RainIcon className="w-10 h-10 text-blue-500" />
  }
  if (lowerCondition.includes('snow')) {
    return <SnowIcon className="w-10 h-10 text-blue-300" />
  }
  if (lowerCondition.includes('thunder')) {
    return <ThunderIcon className="w-10 h-10 text-purple-500" />
  }
  if (lowerCondition.includes('fog')) {
    return <FogIcon className="w-10 h-10 text-gray-300" />
  }

  return <CloudIcon className="w-10 h-10 text-gray-400" />
}

// Icon components
function WeatherIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
      />
    </svg>
  )
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" strokeWidth="2" stroke="currentColor" fill="none" />
    </svg>
  )
}

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 18H6a5 5 0 01-.5-9.98A7 7 0 0118.5 10H19a4 4 0 010 8z" />
    </svg>
  )
}

function RainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      <path strokeLinecap="round" strokeWidth={2} d="M8 19v2M12 19v2M16 19v2" />
    </svg>
  )
}

function SnowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <circle cx="8" cy="20" r="1" />
      <circle cx="12" cy="20" r="1" />
      <circle cx="16" cy="20" r="1" />
      <circle cx="10" cy="22" r="1" />
      <circle cx="14" cy="22" r="1" />
      <path fill="none" stroke="currentColor" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
    </svg>
  )
}

function ThunderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      <path strokeLinecap="round" strokeWidth={2} d="M13 11l-2 4h3l-2 4" />
    </svg>
  )
}

function FogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeWidth={2} d="M4 14h16M6 18h12M8 22h8" />
      <path strokeLinecap="round" strokeWidth={2} d="M3 10a4 4 0 014-4h.5a5 5 0 019 0h.5a4 4 0 014 4" />
    </svg>
  )
}

// Configuration component for form builder
export function WeatherFieldConfigPanel({
  field,
  onUpdate,
}: {
  field: { weatherConfig?: WeatherFieldConfig }
  onUpdate: (config: WeatherFieldConfig) => void
}) {
  const config: WeatherFieldConfig = field.weatherConfig || {
    autoFetch: true,
    units: 'imperial',
    fields: ['temperature', 'humidity', 'conditions', 'wind'],
  }

  const handleFieldToggle = (fieldName: WeatherFieldConfig['fields'][number]) => {
    const newFields = config.fields.includes(fieldName)
      ? config.fields.filter((f) => f !== fieldName)
      : [...config.fields, fieldName]
    onUpdate({ ...config, fields: newFields })
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={config.autoFetch}
            onChange={(e) => onUpdate({ ...config, autoFetch: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Auto-fetch on form load</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Units
        </label>
        <select
          value={config.units}
          onChange={(e) =>
            onUpdate({ ...config, units: e.target.value as 'metric' | 'imperial' })
          }
          className="input w-full"
        >
          <option value="imperial">Imperial (°F, mph)</option>
          <option value="metric">Metric (°C, km/h)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Fields
        </label>
        <div className="space-y-2">
          {(['temperature', 'humidity', 'conditions', 'wind'] as const).map((fieldName) => (
            <label key={fieldName} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.fields.includes(fieldName)}
                onChange={() => handleFieldToggle(fieldName)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 capitalize">{fieldName}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fixed Location (Optional)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={config.location?.latitude || ''}
            onChange={(e) =>
              onUpdate({
                ...config,
                location: {
                  ...config.location,
                  latitude: parseFloat(e.target.value) || undefined,
                },
              })
            }
            className="input text-sm"
          />
          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={config.location?.longitude || ''}
            onChange={(e) =>
              onUpdate({
                ...config,
                location: {
                  ...config.location,
                  longitude: parseFloat(e.target.value) || undefined,
                },
              })
            }
            className="input text-sm"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use device location
        </p>
      </div>
    </div>
  )
}
