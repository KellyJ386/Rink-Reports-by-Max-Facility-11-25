'use client'

import { useState, useCallback, useEffect } from 'react'
import { bluetoothService, type MeasurementReading, type BluetoothDeviceInfo } from '@/lib/bluetooth'

interface MeasurementPoint {
  id: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  label: string
  value?: number
}

interface DepthThresholds {
  target: number      // Target depth (default 1.25")
  optimal: number     // Tolerance for "optimal" (default 0.125")
  warning: number     // Tolerance for "warning" (default 0.25")
}

interface IceDepthGridProps {
  presetType?: 'RINK_25' | 'RINK_35' | 'RINK_47' | 'CUSTOM'
  customPoints?: MeasurementPoint[]
  values: Record<string, number>
  onChange: (values: Record<string, number>) => void
  readOnly?: boolean
  showLabels?: boolean
  showBluetooth?: boolean
  thresholds?: Partial<DepthThresholds>
  backgroundImage?: string | null
}

const DEFAULT_THRESHOLDS: DepthThresholds = {
  target: 1.25,
  optimal: 0.125,
  warning: 0.25,
}

// Standard NHL rink measurement points (25-point grid)
const PRESET_25: MeasurementPoint[] = [
  // Row 1 (behind goal)
  { id: 'p1', x: 10, y: 10, label: '1' },
  { id: 'p2', x: 30, y: 10, label: '2' },
  { id: 'p3', x: 50, y: 10, label: '3' },
  { id: 'p4', x: 70, y: 10, label: '4' },
  { id: 'p5', x: 90, y: 10, label: '5' },
  // Row 2
  { id: 'p6', x: 10, y: 30, label: '6' },
  { id: 'p7', x: 30, y: 30, label: '7' },
  { id: 'p8', x: 50, y: 30, label: '8' },
  { id: 'p9', x: 70, y: 30, label: '9' },
  { id: 'p10', x: 90, y: 30, label: '10' },
  // Row 3 (center ice)
  { id: 'p11', x: 10, y: 50, label: '11' },
  { id: 'p12', x: 30, y: 50, label: '12' },
  { id: 'p13', x: 50, y: 50, label: '13' },
  { id: 'p14', x: 70, y: 50, label: '14' },
  { id: 'p15', x: 90, y: 50, label: '15' },
  // Row 4
  { id: 'p16', x: 10, y: 70, label: '16' },
  { id: 'p17', x: 30, y: 70, label: '17' },
  { id: 'p18', x: 50, y: 70, label: '18' },
  { id: 'p19', x: 70, y: 70, label: '19' },
  { id: 'p20', x: 90, y: 70, label: '20' },
  // Row 5 (behind goal)
  { id: 'p21', x: 10, y: 90, label: '21' },
  { id: 'p22', x: 30, y: 90, label: '22' },
  { id: 'p23', x: 50, y: 90, label: '23' },
  { id: 'p24', x: 70, y: 90, label: '24' },
  { id: 'p25', x: 90, y: 90, label: '25' },
]

// 35-point grid adds more edge measurements
const PRESET_35: MeasurementPoint[] = [
  ...PRESET_25,
  // Additional edge points
  { id: 'p26', x: 5, y: 20, label: '26' },
  { id: 'p27', x: 95, y: 20, label: '27' },
  { id: 'p28', x: 5, y: 40, label: '28' },
  { id: 'p29', x: 95, y: 40, label: '29' },
  { id: 'p30', x: 5, y: 60, label: '30' },
  { id: 'p31', x: 95, y: 60, label: '31' },
  { id: 'p32', x: 5, y: 80, label: '32' },
  { id: 'p33', x: 95, y: 80, label: '33' },
  { id: 'p34', x: 20, y: 5, label: '34' },
  { id: 'p35', x: 80, y: 5, label: '35' },
]

// 47-point comprehensive grid
const PRESET_47: MeasurementPoint[] = [
  ...PRESET_35,
  // More internal points
  { id: 'p36', x: 20, y: 20, label: '36' },
  { id: 'p37', x: 40, y: 20, label: '37' },
  { id: 'p38', x: 60, y: 20, label: '38' },
  { id: 'p39', x: 80, y: 20, label: '39' },
  { id: 'p40', x: 20, y: 40, label: '40' },
  { id: 'p41', x: 40, y: 40, label: '41' },
  { id: 'p42', x: 60, y: 40, label: '42' },
  { id: 'p43', x: 80, y: 40, label: '43' },
  { id: 'p44', x: 20, y: 60, label: '44' },
  { id: 'p45', x: 40, y: 60, label: '45' },
  { id: 'p46', x: 60, y: 60, label: '46' },
  { id: 'p47', x: 80, y: 60, label: '47' },
]

function getPresetPoints(preset?: string): MeasurementPoint[] {
  switch (preset) {
    case 'RINK_35':
      return PRESET_35
    case 'RINK_47':
      return PRESET_47
    case 'RINK_25':
    default:
      return PRESET_25
  }
}

function getDepthColor(value: number | undefined, thresholds: DepthThresholds): string {
  if (value === undefined) return 'bg-gray-200'

  const diff = value - thresholds.target
  if (Math.abs(diff) <= thresholds.optimal) return 'bg-green-500' // Good
  if (diff > thresholds.optimal) return 'bg-blue-500' // Too thick
  if (diff < -thresholds.optimal && diff >= -thresholds.warning) return 'bg-yellow-500' // Getting thin
  return 'bg-red-500' // Too thin
}

export default function IceDepthGrid({
  presetType = 'RINK_25',
  customPoints,
  values,
  onChange,
  readOnly = false,
  showLabels = true,
  showBluetooth = true,
  thresholds: customThresholds,
  backgroundImage,
}: IceDepthGridProps) {
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDeviceInfo | null>(null)
  const [bluetoothSupported, setBluetoothSupported] = useState(false)
  const [bluetoothError, setBluetoothError] = useState<string | null>(null)
  const [lastReading, setLastReading] = useState<MeasurementReading | null>(null)

  const thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds }
  const points = customPoints || getPresetPoints(presetType)

  // Check Bluetooth support on mount
  useEffect(() => {
    setBluetoothSupported(bluetoothService.isSupported())
  }, [])

  // Subscribe to Bluetooth events
  useEffect(() => {
    if (!showBluetooth) return

    const unsubMeasurement = bluetoothService.onMeasurement((reading) => {
      setLastReading(reading)
      // If a point is selected, apply the reading
      if (selectedPoint) {
        const roundedValue = Math.round(reading.value * 1000) / 1000
        onChange({ ...values, [selectedPoint]: roundedValue })
        // Auto-advance to next unmeasured point
        const currentIndex = points.findIndex(p => p.id === selectedPoint)
        const nextUnmeasured = points.slice(currentIndex + 1).find(p => values[p.id] === undefined)
        if (nextUnmeasured) {
          setSelectedPoint(nextUnmeasured.id)
        } else {
          setSelectedPoint(null)
        }
      }
    })

    const unsubConnection = bluetoothService.onConnectionChange((device) => {
      setBluetoothDevice(device.connected ? device : null)
      if (!device.connected) {
        setBluetoothError(null)
      }
    })

    const unsubError = bluetoothService.onError((error) => {
      setBluetoothError(error.message)
    })

    return () => {
      unsubMeasurement()
      unsubConnection()
      unsubError()
    }
  }, [showBluetooth, selectedPoint, points, values, onChange])

  const handleConnectBluetooth = async () => {
    setBluetoothError(null)
    try {
      await bluetoothService.connect()
    } catch (error) {
      // Error is handled by the error callback
    }
  }

  const handleDisconnectBluetooth = async () => {
    await bluetoothService.disconnect()
    setBluetoothDevice(null)
  }

  const handlePointClick = useCallback((pointId: string) => {
    if (readOnly) return
    setSelectedPoint(pointId)
    setInputValue(values[pointId]?.toString() || '')
  }, [readOnly, values])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const handleInputBlur = useCallback(() => {
    if (selectedPoint && inputValue !== '') {
      const numValue = parseFloat(inputValue)
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 5) {
        onChange({ ...values, [selectedPoint]: numValue })
      }
    }
    setSelectedPoint(null)
    setInputValue('')
  }, [selectedPoint, inputValue, values, onChange])

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur()
      // Move to next point
      const currentIndex = points.findIndex(p => p.id === selectedPoint)
      if (currentIndex < points.length - 1) {
        const nextPoint = points[currentIndex + 1]
        setSelectedPoint(nextPoint.id)
        setInputValue(values[nextPoint.id]?.toString() || '')
      }
    } else if (e.key === 'Escape') {
      setSelectedPoint(null)
      setInputValue('')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleInputBlur()
      const currentIndex = points.findIndex(p => p.id === selectedPoint)
      const nextIndex = e.shiftKey
        ? Math.max(0, currentIndex - 1)
        : Math.min(points.length - 1, currentIndex + 1)
      const nextPoint = points[nextIndex]
      setSelectedPoint(nextPoint.id)
      setInputValue(values[nextPoint.id]?.toString() || '')
    }
  }, [handleInputBlur, selectedPoint, points, values])

  // Calculate stats
  const filledPoints = Object.keys(values).length
  const totalPoints = points.length
  const avgDepth = filledPoints > 0
    ? (Object.values(values).reduce((a, b) => a + b, 0) / filledPoints).toFixed(3)
    : '--'
  const minDepth = filledPoints > 0
    ? Math.min(...Object.values(values)).toFixed(3)
    : '--'
  const maxDepth = filledPoints > 0
    ? Math.max(...Object.values(values)).toFixed(3)
    : '--'

  // Calculate dynamic legend values
  const optimalMin = (thresholds.target - thresholds.optimal).toFixed(3)
  const optimalMax = (thresholds.target + thresholds.optimal).toFixed(3)
  const warningMin = (thresholds.target - thresholds.warning).toFixed(3)

  return (
    <div className="space-y-4">
      {/* Bluetooth Controls */}
      {showBluetooth && bluetoothSupported && !readOnly && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className={`w-5 h-5 ${bluetoothDevice ? 'text-blue-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
            </svg>
            {bluetoothDevice ? (
              <>
                <span className="text-sm text-green-600 font-medium">
                  Connected: {bluetoothDevice.name}
                </span>
                <button
                  onClick={handleDisconnectBluetooth}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={handleConnectBluetooth}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Connect Digital Caliper
              </button>
            )}
          </div>
          {lastReading && (
            <div className="text-sm text-gray-500">
              Last reading: {lastReading.value.toFixed(3)}"
            </div>
          )}
          {bluetoothError && (
            <div className="text-sm text-red-600">
              {bluetoothError}
            </div>
          )}
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Points:</span>
          <span className="font-medium">{filledPoints}/{totalPoints}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Target:</span>
          <span className="font-medium">{thresholds.target}"</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Avg:</span>
          <span className="font-medium">{avgDepth}"</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Min:</span>
          <span className="font-medium">{minDepth}"</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Max:</span>
          <span className="font-medium">{maxDepth}"</span>
        </div>
      </div>

      {/* Rink Diagram */}
      <div className="relative bg-white border-2 border-gray-300 rounded-lg overflow-hidden" style={{ aspectRatio: '2/1' }}>
        {/* Custom background or default ice surface */}
        {backgroundImage ? (
          <img
            src={backgroundImage}
            alt="Rink diagram"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-blue-100" />
        )}

        {/* Rink markings (only show if no custom background) */}
        {!backgroundImage && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
            {/* Center line */}
            <line x1="100" y1="0" x2="100" y2="100" stroke="#dc2626" strokeWidth="0.5" />
            {/* Center circle */}
            <circle cx="100" cy="50" r="15" fill="none" stroke="#2563eb" strokeWidth="0.3" />
            {/* Blue lines */}
            <line x1="65" y1="0" x2="65" y2="100" stroke="#2563eb" strokeWidth="0.5" />
            <line x1="135" y1="0" x2="135" y2="100" stroke="#2563eb" strokeWidth="0.5" />
            {/* Goal creases */}
            <path d="M 5 40 Q 15 50 5 60" fill="none" stroke="#2563eb" strokeWidth="0.3" />
            <path d="M 195 40 Q 185 50 195 60" fill="none" stroke="#2563eb" strokeWidth="0.3" />
            {/* Face-off circles */}
            <circle cx="35" cy="30" r="8" fill="none" stroke="#dc2626" strokeWidth="0.2" />
            <circle cx="35" cy="70" r="8" fill="none" stroke="#dc2626" strokeWidth="0.2" />
            <circle cx="165" cy="30" r="8" fill="none" stroke="#dc2626" strokeWidth="0.2" />
            <circle cx="165" cy="70" r="8" fill="none" stroke="#dc2626" strokeWidth="0.2" />
          </svg>
        )}

        {/* Measurement Points */}
        {points.map((point) => {
          const value = values[point.id]
          const isSelected = selectedPoint === point.id
          const color = getDepthColor(value, thresholds)

          return (
            <div
              key={point.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              {isSelected ? (
                <input
                  type="number"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  onKeyDown={handleInputKeyDown}
                  className="w-14 h-8 text-center text-sm border-2 border-blue-500 rounded focus:outline-none"
                  step="0.125"
                  min="0"
                  max="5"
                  autoFocus
                  placeholder="0.00"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => handlePointClick(point.id)}
                  disabled={readOnly}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    text-xs font-medium transition-all
                    ${color} ${value !== undefined ? 'text-white' : 'text-gray-600'}
                    ${!readOnly ? 'hover:scale-110 cursor-pointer' : 'cursor-default'}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                    shadow-sm
                  `}
                  title={`Point ${point.label}: ${value !== undefined ? `${value}"` : 'Not measured'}`}
                >
                  {showLabels ? (value !== undefined ? value.toFixed(2) : point.label) : (value !== undefined ? '✓' : '')}
                </button>
              )}
            </div>
          )
        })}

        {/* Bluetooth indicator */}
        {bluetoothDevice && selectedPoint && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <svg className="w-3 h-3 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
            </svg>
            Awaiting reading...
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Optimal ({optimalMin}"-{optimalMax}")</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Thick ({">"} {optimalMax}")</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Thin ({warningMin}"-{optimalMin}")</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Critical ({"<"} {warningMin}")</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-200" />
          <span>Not measured</span>
        </div>
      </div>

      {!readOnly && (
        <p className="text-xs text-gray-400">
          Click on a point to enter a depth measurement (use Tab/Enter to navigate).
          {bluetoothDevice && ' Bluetooth caliper readings will auto-populate the selected point.'}
        </p>
      )}
    </div>
  )
}
