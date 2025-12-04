'use client'

import { useState } from 'react'
import type { BluetoothDevice, BluetoothMeasurement } from '@/hooks/useBluetooth'

interface BluetoothConnectProps {
  isSupported: boolean
  isScanning: boolean
  isConnecting: boolean
  isConnected: boolean
  device: BluetoothDevice | null
  lastMeasurement: BluetoothMeasurement | null
  error: string | null
  onScan: () => Promise<void>
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
  onRequestMeasurement: () => Promise<BluetoothMeasurement | null>
  onClearError: () => void
  // Optional: callback when measurement is captured to specific point
  onCaptureMeasurement?: (value: number) => void
  disabled?: boolean
}

export function BluetoothConnect({
  isSupported,
  isScanning,
  isConnecting,
  isConnected,
  device,
  lastMeasurement,
  error,
  onScan,
  onConnect,
  onDisconnect,
  onRequestMeasurement,
  onClearError,
  onCaptureMeasurement,
  disabled,
}: BluetoothConnectProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTakingMeasurement, setIsTakingMeasurement] = useState(false)

  const handleTakeMeasurement = async () => {
    setIsTakingMeasurement(true)
    try {
      const measurement = await onRequestMeasurement()
      if (measurement && onCaptureMeasurement) {
        onCaptureMeasurement(measurement.value)
      }
    } finally {
      setIsTakingMeasurement(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 className="font-medium text-yellow-800">Bluetooth Not Available</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Your browser or device doesn&apos;t support Web Bluetooth. Use Chrome, Edge, or Opera on a desktop for Bluetooth gauge connectivity.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
      >
        <div className="flex items-center gap-3">
          {/* Bluetooth Icon */}
          <div className={`p-2 rounded-full ${isConnected ? 'bg-blue-100' : 'bg-gray-200'}`}>
            <svg
              className={`w-5 h-5 ${isConnected ? 'text-blue-600' : 'text-gray-500'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
            </svg>
          </div>

          <div className="text-left">
            <div className="font-medium text-gray-900">
              {isConnected ? 'Bluetooth Gauge Connected' : 'Connect Bluetooth Gauge'}
            </div>
            {device && isConnected && (
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <span>{device.name}</span>
                {device.batteryLevel !== undefined && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7v14" />
                    </svg>
                    {device.batteryLevel}%
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {isConnected && (
            <span className="flex items-center gap-1.5 text-sm text-green-600">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Connected
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 border-t space-y-4">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start justify-between">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
              <button
                type="button"
                onClick={onClearError}
                className="text-red-400 hover:text-red-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Not Connected State */}
          {!isConnected && (
            <div className="space-y-3">
              {!device ? (
                <>
                  <p className="text-sm text-gray-600">
                    Connect a Bluetooth-enabled ice depth gauge to automatically capture measurements.
                  </p>
                  <button
                    type="button"
                    onClick={onScan}
                    disabled={isScanning || disabled}
                    className="w-full btn btn-primary flex items-center justify-center gap-2"
                  >
                    {isScanning ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Scanning for devices...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
                        </svg>
                        Scan for Devices
                      </>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{device.name}</div>
                        <div className="text-xs text-gray-500">Ready to connect</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onConnect}
                      disabled={isConnecting || disabled}
                      className="flex-1 btn btn-primary flex items-center justify-center gap-2"
                    >
                      {isConnecting ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Connecting...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onScan}
                      disabled={isScanning || disabled}
                      className="btn btn-secondary"
                    >
                      Scan Again
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Connected State */}
          {isConnected && device && (
            <div className="space-y-4">
              {/* Device Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-green-900">{device.name}</div>
                      <div className="text-sm text-green-700">
                        {device.batteryLevel !== undefined && `Battery: ${device.batteryLevel}%`}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onDisconnect}
                    className="text-sm text-green-700 hover:text-green-900 underline"
                  >
                    Disconnect
                  </button>
                </div>
              </div>

              {/* Take Measurement Button */}
              <button
                type="button"
                onClick={handleTakeMeasurement}
                disabled={isTakingMeasurement || disabled}
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
              >
                {isTakingMeasurement ? (
                  <>
                    <svg className="w-6 h-6 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Reading from gauge...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Take Measurement from Gauge
                  </>
                )}
              </button>

              {/* Last Measurement */}
              {lastMeasurement && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <div className="text-sm text-blue-600 mb-1">Last Reading</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {lastMeasurement.value.toFixed(2)}&quot;
                  </div>
                  <div className="text-xs text-blue-500 mt-1">
                    {lastMeasurement.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                <p className="font-medium text-gray-700 mb-1">How to use:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Select a measurement point on the grid</li>
                  <li>Place the gauge on the ice at that location</li>
                  <li>Click &quot;Take Measurement&quot; or press the button on your gauge</li>
                  <li>The reading will be automatically recorded</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Compact version for inline use
export function BluetoothStatus({
  isConnected,
  device,
  lastMeasurement,
  onClick,
}: {
  isConnected: boolean
  device: BluetoothDevice | null
  lastMeasurement: BluetoothMeasurement | null
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
        isConnected
          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <svg
        className={`w-4 h-4 ${isConnected ? 'text-blue-600' : 'text-gray-400'}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29zM13 5.83l1.88 1.88L13 9.59V5.83zm1.88 10.46L13 18.17v-3.76l1.88 1.88z"/>
      </svg>
      {isConnected ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          <span>{device?.name || 'Connected'}</span>
          {lastMeasurement && (
            <span className="font-medium">{lastMeasurement.value.toFixed(2)}&quot;</span>
          )}
        </>
      ) : (
        <span>Connect Gauge</span>
      )}
    </button>
  )
}
