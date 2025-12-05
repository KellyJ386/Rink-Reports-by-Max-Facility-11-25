'use client'

import { useState, useEffect } from 'react'

interface AirQualityAlertProps {
  coLevel?: number
  no2Level?: number
  onDismiss?: () => void
}

interface Thresholds {
  coWarningPpm: number
  coEvacuationPpm: number
  no2WarningPpm: number
  no2EvacuationPpm: number
  enableAirQualityAlerts: boolean
}

export function AirQualityAlert({ coLevel, no2Level, onDismiss }: AirQualityAlertProps) {
  const [thresholds, setThresholds] = useState<Thresholds | null>(null)
  const [alertLevel, setAlertLevel] = useState<'normal' | 'warning' | 'evacuation'>('normal')
  const [alertType, setAlertType] = useState<'CO' | 'NO2' | null>(null)

  useEffect(() => {
    fetchThresholds()
  }, [])

  useEffect(() => {
    if (thresholds && thresholds.enableAirQualityAlerts) {
      checkLevels()
    }
  }, [thresholds, coLevel, no2Level])

  const fetchThresholds = async () => {
    try {
      const res = await fetch('/api/alerts/air-quality')
      if (res.ok) {
        const data = await res.json()
        setThresholds(data.thresholds)
      }
    } catch (error) {
      console.error('Failed to fetch thresholds:', error)
    }
  }

  const checkLevels = () => {
    if (!thresholds) return

    // Check CO
    if (coLevel !== undefined) {
      if (coLevel >= thresholds.coEvacuationPpm) {
        setAlertLevel('evacuation')
        setAlertType('CO')
        return
      }
      if (coLevel >= thresholds.coWarningPpm) {
        setAlertLevel('warning')
        setAlertType('CO')
        return
      }
    }

    // Check NO2
    if (no2Level !== undefined) {
      if (no2Level >= thresholds.no2EvacuationPpm) {
        setAlertLevel('evacuation')
        setAlertType('NO2')
        return
      }
      if (no2Level >= thresholds.no2WarningPpm) {
        setAlertLevel('warning')
        setAlertType('NO2')
        return
      }
    }

    setAlertLevel('normal')
    setAlertType(null)
  }

  if (alertLevel === 'normal' || !thresholds?.enableAirQualityAlerts) {
    return null
  }

  const reading = alertType === 'CO' ? coLevel : no2Level
  const threshold = alertType === 'CO'
    ? (alertLevel === 'evacuation' ? thresholds.coEvacuationPpm : thresholds.coWarningPpm)
    : (alertLevel === 'evacuation' ? thresholds.no2EvacuationPpm : thresholds.no2WarningPpm)

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 p-4 ${
        alertLevel === 'evacuation'
          ? 'bg-red-600 text-white'
          : 'bg-yellow-500 text-yellow-900'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-3xl">
            {alertLevel === 'evacuation' ? '🚨' : '⚠️'}
          </span>
          <div>
            <h2 className="text-lg font-bold">
              {alertLevel === 'evacuation'
                ? 'EVACUATION REQUIRED'
                : 'Air Quality Warning'}
            </h2>
            <p className="text-sm">
              {alertType} level: {reading} ppm (threshold: {threshold} ppm)
              {alertLevel === 'evacuation' && ' - Begin evacuation procedures immediately!'}
            </p>
          </div>
        </div>
        {alertLevel === 'warning' && onDismiss && (
          <button
            onClick={onDismiss}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium"
          >
            Acknowledge
          </button>
        )}
      </div>
    </div>
  )
}

export function AirQualityIndicator({ coLevel, no2Level }: { coLevel?: number; no2Level?: number }) {
  const [thresholds, setThresholds] = useState<Thresholds | null>(null)

  useEffect(() => {
    fetchThresholds()
  }, [])

  const fetchThresholds = async () => {
    try {
      const res = await fetch('/api/alerts/air-quality')
      if (res.ok) {
        const data = await res.json()
        setThresholds(data.thresholds)
      }
    } catch (error) {
      console.error('Failed to fetch thresholds:', error)
    }
  }

  if (!thresholds) return null

  const getStatus = (value: number | undefined, warning: number, evacuation: number) => {
    if (value === undefined) return 'unknown'
    if (value >= evacuation) return 'critical'
    if (value >= warning) return 'warning'
    return 'normal'
  }

  const coStatus = getStatus(coLevel, thresholds.coWarningPpm, thresholds.coEvacuationPpm)
  const no2Status = getStatus(no2Level, thresholds.no2WarningPpm, thresholds.no2EvacuationPpm)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  return (
    <div className="flex gap-4">
      <div className={`px-3 py-2 rounded-lg border ${getStatusColor(coStatus)}`}>
        <p className="text-xs font-medium">CO</p>
        <p className="text-lg font-bold">{coLevel ?? '-'} ppm</p>
      </div>
      <div className={`px-3 py-2 rounded-lg border ${getStatusColor(no2Status)}`}>
        <p className="text-xs font-medium">NO2</p>
        <p className="text-lg font-bold">{no2Level ?? '-'} ppm</p>
      </div>
    </div>
  )
}
