'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UniversalHeader } from '@/components/reports/UniversalHeader'
import {
  IceDepthGridFieldRender,
  GridTypeSelector,
  GRID_CONFIGS,
  type GridType,
} from '@/components/form-builder/fields/IceDepthGridField'
import { BluetoothConnect } from '@/components/bluetooth'
import { useBluetooth, useSimulatedBluetooth, type BluetoothMeasurement } from '@/hooks/useBluetooth'

interface Facility {
  id: string
  name: string
  rinks: { id: string; name: string }[]
}

interface HeaderData {
  facilityId: string
  rinkId?: string
  dateTime: string
  outsideTemp?: number
  submittedBy: { id: string; name: string }
}

interface MeasurementPoint {
  id: string
  x: number
  y: number
  label: string
}

// Use simulated Bluetooth in development for testing
const USE_SIMULATED_BLUETOOTH = process.env.NODE_ENV === 'development'

export default function NewIceDepthPage() {
  const router = useRouter()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [headerData, setHeaderData] = useState<HeaderData | null>(null)
  const [gridType, setGridType] = useState<GridType>('25')
  const [customPoints, setCustomPoints] = useState<MeasurementPoint[]>([])
  const [measurements, setMeasurements] = useState<Record<string, number | null>>({})
  const [notes, setNotes] = useState('')

  // Bluetooth state
  const [selectedPointForBluetooth, setSelectedPointForBluetooth] = useState<string | null>(null)
  const [bluetoothMeasurementHistory, setBluetoothMeasurementHistory] = useState<Array<{
    pointId: string
    value: number
    timestamp: Date
  }>>([])

  // Mock current user - in real app, get from auth context
  const currentUser = { id: 'user_1', name: 'John Doe' }

  // Bluetooth hook - handles measurement from connected gauges
  const handleBluetoothMeasurement = useCallback((measurement: BluetoothMeasurement) => {
    if (selectedPointForBluetooth) {
      // Auto-apply measurement to selected point
      setMeasurements((prev) => ({
        ...prev,
        [selectedPointForBluetooth]: measurement.value,
      }))

      // Add to history
      setBluetoothMeasurementHistory((prev) => [
        ...prev,
        {
          pointId: selectedPointForBluetooth,
          value: measurement.value,
          timestamp: measurement.timestamp,
        },
      ])

      // Auto-advance to next point
      const points = gridType === 'custom' ? customPoints : GRID_CONFIGS[gridType].points
      const currentIndex = points.findIndex((p) => p.id === selectedPointForBluetooth)
      if (currentIndex < points.length - 1) {
        setSelectedPointForBluetooth(points[currentIndex + 1].id)
      }
    }
  }, [selectedPointForBluetooth, gridType, customPoints])

  // Use simulated or real Bluetooth based on environment
  const bluetoothHook = USE_SIMULATED_BLUETOOTH ? useSimulatedBluetooth : useBluetooth
  const bluetooth = bluetoothHook({
    onMeasurement: handleBluetoothMeasurement,
  })

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/facilities')
      const data = await response.json()

      if (data.success) {
        setFacilities(data.data)
      } else {
        setError('Failed to load facilities')
      }
    } catch {
      setError('Failed to load facilities')
    } finally {
      setLoading(false)
    }
  }

  const handleHeaderChange = useCallback((data: HeaderData) => {
    setHeaderData(data)
  }, [])

  // Reset measurements when grid type changes
  const handleGridTypeChange = (newType: GridType) => {
    setGridType(newType)
    setMeasurements({}) // Clear measurements when changing grid type
    setSelectedPointForBluetooth(null)
    if (newType !== 'custom') {
      setCustomPoints([]) // Clear custom points if not in custom mode
    }
  }

  const calculateStats = () => {
    const values = Object.values(measurements).filter((v): v is number => v !== null && v !== undefined)
    if (values.length === 0) return { avg: 0, min: 0, max: 0, count: 0 }
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length,
    }
  }

  const getTotalPoints = () => {
    if (gridType === 'custom') return customPoints.length
    return GRID_CONFIGS[gridType].points.length
  }

  // Handle capturing a measurement to a specific point
  const handleCaptureToPoint = useCallback((value: number) => {
    if (selectedPointForBluetooth) {
      setMeasurements((prev) => ({
        ...prev,
        [selectedPointForBluetooth]: value,
      }))
    }
  }, [selectedPointForBluetooth])

  const handleSubmit = async (asDraft = false) => {
    if (!headerData?.facilityId) {
      setError('Please select a facility')
      return
    }
    if (!headerData?.rinkId) {
      setError('Please select a rink')
      return
    }

    const stats = calculateStats()
    const totalPoints = getTotalPoints()
    const minRequired = Math.min(5, totalPoints)

    if (!asDraft && stats.count < minRequired) {
      setError(`Please record at least ${minRequired} measurement points`)
      return
    }

    if (gridType === 'custom' && customPoints.length === 0 && !asDraft) {
      setError('Please add at least one measurement point to the custom diagram')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleType: 'ICE_DEPTH',
          facilityId: headerData.facilityId,
          rinkId: headerData.rinkId,
          status: asDraft ? 'DRAFT' : 'SUBMITTED',
          data: {
            gridType,
            customPoints: gridType === 'custom' ? customPoints : undefined,
            measurements,
            notes,
            outsideTemp: headerData.outsideTemp,
            stats: calculateStats(),
            bluetoothUsed: bluetoothMeasurementHistory.length > 0,
            bluetoothHistory: bluetoothMeasurementHistory.length > 0 ? bluetoothMeasurementHistory : undefined,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        router.push(`/dashboard/ice-depth/${data.data.id}`)
      } else {
        setError(data.error?.message || 'Failed to save reading')
      }
    } catch {
      setError('Failed to save reading')
    } finally {
      setSubmitting(false)
    }
  }

  const stats = calculateStats()
  const totalPoints = getTotalPoints()
  const points = gridType === 'custom' ? customPoints : GRID_CONFIGS[gridType].points

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ice-depth" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Ice Depth Reading</h1>
            <p className="text-gray-500">Record ice thickness measurements across the rink</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Universal Header */}
      <UniversalHeader
        facilities={facilities}
        currentUser={currentUser}
        onChange={handleHeaderChange}
        requireRink={true}
        showWeather={true}
        disabled={submitting}
      />

      {/* Bluetooth Connection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bluetooth Ice Depth Gauge</h2>
        <BluetoothConnect
          isSupported={bluetooth.isSupported}
          isScanning={bluetooth.isScanning}
          isConnecting={bluetooth.isConnecting}
          isConnected={bluetooth.isConnected}
          device={bluetooth.device}
          lastMeasurement={bluetooth.lastMeasurement}
          error={bluetooth.error}
          onScan={bluetooth.scan}
          onConnect={bluetooth.connect}
          onDisconnect={bluetooth.disconnect}
          onRequestMeasurement={bluetooth.requestMeasurement}
          onClearError={bluetooth.clearError}
          onCaptureMeasurement={handleCaptureToPoint}
          disabled={submitting}
        />

        {/* Selected Point for Bluetooth */}
        {bluetooth.isConnected && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-blue-900">Active Measurement Point</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {selectedPointForBluetooth
                    ? `Point ${points.find((p) => p.id === selectedPointForBluetooth)?.label || selectedPointForBluetooth} selected - readings will be recorded here`
                    : 'Select a point on the grid below to record Bluetooth measurements'
                  }
                </p>
              </div>
              {selectedPointForBluetooth && (
                <button
                  type="button"
                  onClick={() => setSelectedPointForBluetooth(null)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Quick point selector */}
            {points.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-blue-600 mb-2">Quick Select Point:</div>
                <div className="flex flex-wrap gap-1">
                  {points.slice(0, 15).map((point) => (
                    <button
                      key={point.id}
                      type="button"
                      onClick={() => setSelectedPointForBluetooth(point.id)}
                      className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                        selectedPointForBluetooth === point.id
                          ? 'bg-blue-600 text-white'
                          : measurements[point.id] != null
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {point.label}
                    </button>
                  ))}
                  {points.length > 15 && (
                    <span className="text-xs text-blue-500 self-center ml-2">
                      +{points.length - 15} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid Type Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Measurement Grid Type</h2>
        <p className="text-sm text-gray-500 mb-4">
          Select the measurement grid pattern for this reading. Use Custom Diagram to place points at specific locations.
        </p>
        <GridTypeSelector
          value={gridType}
          onChange={handleGridTypeChange}
          disabled={submitting}
        />
      </div>

      {/* Ice Depth Grid */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ice Depth Measurements</h2>
            <p className="text-sm text-gray-500 mt-1">
              {gridType === 'custom'
                ? 'Click "Add Measurement Point" to place custom measurement locations on the rink diagram.'
                : bluetooth.isConnected
                ? 'Click a point to select it for Bluetooth measurement, or click to enter manually.'
                : 'Click on a measurement point to enter its ice depth. Target depth is typically 0.75" - 1.25".'
              }
            </p>
          </div>
          {bluetoothMeasurementHistory.length > 0 && (
            <div className="text-sm text-blue-600 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
              </svg>
              {bluetoothMeasurementHistory.length} Bluetooth readings
            </div>
          )}
        </div>

        <IceDepthGridFieldRender
          field={{
            id: 'ice_depth_grid',
            type: 'iceDepthGrid',
            label: 'Ice Depth Grid',
            required: true,
          }}
          value={measurements}
          onChange={(value) => setMeasurements(value as Record<string, number | null>)}
          disabled={submitting}
          gridType={gridType}
          customPoints={customPoints}
          onCustomPointsChange={setCustomPoints}
          allowAddPoints={true}
        />
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Reading Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{GRID_CONFIGS[gridType].label}</div>
            <div className="text-sm text-gray-500">Grid Type</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {stats.count > 0 ? stats.avg.toFixed(2) : '-'}
            </div>
            <div className="text-sm text-gray-500">Average (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {stats.count > 0 ? stats.min.toFixed(2) : '-'}
            </div>
            <div className="text-sm text-gray-500">Minimum (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {stats.count > 0 ? stats.max.toFixed(2) : '-'}
            </div>
            <div className="text-sm text-gray-500">Maximum (in)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">
              {stats.count}/{totalPoints || '0'}
            </div>
            <div className="text-sm text-gray-500">Points Recorded</div>
          </div>
        </div>

        {/* Depth Status Indicator */}
        {stats.count > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-gray-50">
            {stats.avg >= 0.75 && stats.avg <= 1.25 ? (
              <div className="flex items-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Ice depth is within optimal range (0.75&quot; - 1.25&quot;)</span>
              </div>
            ) : stats.avg < 0.75 ? (
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Ice depth is below minimum - consider adding ice</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-yellow-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Ice depth is above optimal - consider trimming ice</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="input w-full"
          placeholder="Any additional observations or notes about the ice condition..."
          disabled={submitting}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Link href="/dashboard/ice-depth" className="btn btn-secondary">
          Cancel
        </Link>
        <button
          onClick={() => handleSubmit(true)}
          disabled={submitting}
          className="btn btn-secondary"
        >
          Save as Draft
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitting || (gridType !== 'custom' && stats.count < Math.min(5, totalPoints)) || (gridType === 'custom' && customPoints.length === 0)}
          className="btn btn-primary"
        >
          {submitting ? 'Submitting...' : 'Submit Reading'}
        </button>
      </div>
    </div>
  )
}
