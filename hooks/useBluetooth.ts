'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

// Common Bluetooth service UUIDs for measurement devices
export const BLUETOOTH_SERVICES = {
  // Generic measurement service (common for digital calipers/gauges)
  GENERIC_MEASUREMENT: '00001800-0000-1000-8000-00805f9b34fb',
  // Custom ice depth gauge service (example UUID - would match actual device)
  ICE_DEPTH_GAUGE: '12345678-1234-5678-1234-56789abcdef0',
  // Heart rate style service (some gauges use this pattern)
  MEASUREMENT_SERVICE: '0000181a-0000-1000-8000-00805f9b34fb',
  // Battery service (most BLE devices support this)
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
}

// Common characteristic UUIDs
export const BLUETOOTH_CHARACTERISTICS = {
  MEASUREMENT_VALUE: '00002a6e-0000-1000-8000-00805f9b34fb',
  MEASUREMENT_INTERVAL: '00002a21-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  DEVICE_NAME: '00002a00-0000-1000-8000-00805f9b34fb',
}

export interface BluetoothDeviceInfo {
  id: string
  name: string
  connected: boolean
  batteryLevel?: number
}

export interface BluetoothMeasurement {
  value: number
  unit: 'inches' | 'mm' | 'cm'
  timestamp: Date
  deviceId: string
}

interface UseBluetoothOptions {
  onMeasurement?: (measurement: BluetoothMeasurement) => void
  onConnectionChange?: (connected: boolean) => void
  onError?: (error: string) => void
  // Service UUIDs to scan for
  services?: string[]
  // Auto-reconnect on disconnect
  autoReconnect?: boolean
}

interface UseBluetoothReturn {
  // State
  isSupported: boolean
  isScanning: boolean
  isConnecting: boolean
  isConnected: boolean
  device: BluetoothDeviceInfo | null
  lastMeasurement: BluetoothMeasurement | null
  error: string | null

  // Actions
  scan: () => Promise<void>
  connect: (deviceId?: string) => Promise<void>
  disconnect: () => Promise<void>
  requestMeasurement: () => Promise<BluetoothMeasurement | null>
  clearError: () => void
}

export function useBluetooth(options: UseBluetoothOptions = {}): UseBluetoothReturn {
  const {
    onMeasurement,
    onConnectionChange,
    onError,
    services = [BLUETOOTH_SERVICES.MEASUREMENT_SERVICE],
    autoReconnect = true,
  } = options

  // State
  const [isSupported, setIsSupported] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [device, setDevice] = useState<BluetoothDeviceInfo | null>(null)
  const [lastMeasurement, setLastMeasurement] = useState<BluetoothMeasurement | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Refs for Bluetooth objects - using 'any' to avoid Web Bluetooth API type conflicts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bluetoothDeviceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gattServerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const characteristicRef = useRef<any>(null)

  // Check Bluetooth support on mount
  useEffect(() => {
    const checkSupport = async () => {
      if (typeof window !== 'undefined' && 'bluetooth' in navigator) {
        try {
          const bluetooth = (navigator as Navigator & { bluetooth?: { getAvailability: () => Promise<boolean> } }).bluetooth
          const available = await bluetooth!.getAvailability()
          setIsSupported(available)
        } catch {
          // Some browsers support the API but getAvailability fails
          setIsSupported(true)
        }
      } else {
        setIsSupported(false)
      }
    }
    checkSupport()
  }, [])

  // Handle measurement notifications
  const handleMeasurementNotification = useCallback((event: Event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const characteristic = event.target as any
    const value = characteristic.value

    if (value) {
      // Parse the measurement value
      // Most gauges send a 2-4 byte value representing the measurement
      // The exact format depends on the device
      let measurementValue: number

      if (value.byteLength >= 4) {
        // Float32 format (common for precision instruments)
        measurementValue = value.getFloat32(0, true)
      } else if (value.byteLength >= 2) {
        // Int16 format with implicit decimal (e.g., 125 = 1.25 inches)
        measurementValue = value.getInt16(0, true) / 100
      } else {
        // Single byte (less common)
        measurementValue = value.getUint8(0) / 100
      }

      const measurement: BluetoothMeasurement = {
        value: measurementValue,
        unit: 'inches',
        timestamp: new Date(),
        deviceId: device?.id || 'unknown',
      }

      setLastMeasurement(measurement)
      onMeasurement?.(measurement)
    }
  }, [device, onMeasurement])

  // Handle device disconnect
  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
    onConnectionChange?.(false)

    if (autoReconnect && bluetoothDeviceRef.current) {
      // Attempt to reconnect after a short delay
      setTimeout(async () => {
        try {
          if (bluetoothDeviceRef.current?.gatt) {
            await bluetoothDeviceRef.current.gatt.connect()
            setIsConnected(true)
            onConnectionChange?.(true)
          }
        } catch (err) {
          console.error('Auto-reconnect failed:', err)
        }
      }, 2000)
    }
  }, [autoReconnect, onConnectionChange])

  // Scan for devices
  const scan = useCallback(async () => {
    if (!isSupported) {
      setError('Bluetooth is not supported on this device')
      onError?.('Bluetooth is not supported on this device')
      return
    }

    setIsScanning(true)
    setError(null)

    try {
      // Request device with specified services
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bluetooth = (navigator as any).bluetooth
      const requestedDevice = await bluetooth.requestDevice({
        filters: [
          { services: services },
          // Also accept devices by name pattern (common gauge names)
          { namePrefix: 'ICE' },
          { namePrefix: 'Gauge' },
          { namePrefix: 'Caliper' },
          { namePrefix: 'Depth' },
        ],
        optionalServices: [
          BLUETOOTH_SERVICES.BATTERY_SERVICE,
          BLUETOOTH_SERVICES.GENERIC_MEASUREMENT,
          ...services,
        ],
      })

      bluetoothDeviceRef.current = requestedDevice

      setDevice({
        id: requestedDevice.id,
        name: requestedDevice.name || 'Unknown Device',
        connected: false,
      })

      // Listen for disconnect events
      requestedDevice.addEventListener('gattserverdisconnected', handleDisconnect)

    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotFoundError') {
          setError('No compatible Bluetooth devices found')
        } else if (err.name === 'SecurityError') {
          setError('Bluetooth permission denied')
        } else {
          setError(err.message)
        }
        onError?.(err.message)
      }
    } finally {
      setIsScanning(false)
    }
  }, [isSupported, services, handleDisconnect, onError])

  // Connect to device
  const connect = useCallback(async () => {
    if (!bluetoothDeviceRef.current) {
      setError('No device selected. Please scan first.')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Connect to GATT server
      const server = await bluetoothDeviceRef.current.gatt?.connect()
      if (!server) {
        throw new Error('Failed to connect to device')
      }
      gattServerRef.current = server

      // Try to get the measurement service
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let service: any = null
      for (const serviceUuid of services) {
        try {
          service = await server.getPrimaryService(serviceUuid)
          break
        } catch {
          // Service not found, try next
        }
      }

      if (service) {
        // Get measurement characteristic
        try {
          const characteristic = await service.getCharacteristic(
            BLUETOOTH_CHARACTERISTICS.MEASUREMENT_VALUE
          )
          characteristicRef.current = characteristic

          // Start notifications for real-time measurements
          await characteristic.startNotifications()
          characteristic.addEventListener(
            'characteristicvaluechanged',
            handleMeasurementNotification
          )
        } catch {
          console.warn('Could not set up measurement notifications')
        }
      }

      // Try to get battery level
      try {
        const batteryService = await server.getPrimaryService(
          BLUETOOTH_SERVICES.BATTERY_SERVICE
        )
        const batteryChar = await batteryService.getCharacteristic(
          BLUETOOTH_CHARACTERISTICS.BATTERY_LEVEL
        )
        const batteryValue = await batteryChar.readValue()
        const batteryLevel = batteryValue.getUint8(0)

        setDevice((prev) =>
          prev ? { ...prev, connected: true, batteryLevel } : null
        )
      } catch {
        setDevice((prev) => (prev ? { ...prev, connected: true } : null))
      }

      setIsConnected(true)
      onConnectionChange?.(true)

    } catch (err) {
      if (err instanceof Error) {
        setError(`Connection failed: ${err.message}`)
        onError?.(err.message)
      }
    } finally {
      setIsConnecting(false)
    }
  }, [services, handleMeasurementNotification, onConnectionChange, onError])

  // Disconnect from device
  const disconnect = useCallback(async () => {
    if (characteristicRef.current) {
      try {
        await characteristicRef.current.stopNotifications()
        characteristicRef.current.removeEventListener(
          'characteristicvaluechanged',
          handleMeasurementNotification
        )
      } catch {
        // Ignore errors during cleanup
      }
    }

    if (gattServerRef.current?.connected) {
      gattServerRef.current.disconnect()
    }

    setIsConnected(false)
    setDevice((prev) => (prev ? { ...prev, connected: false } : null))
    onConnectionChange?.(false)
  }, [handleMeasurementNotification, onConnectionChange])

  // Request a single measurement (for devices that don't auto-notify)
  const requestMeasurement = useCallback(async (): Promise<BluetoothMeasurement | null> => {
    if (!characteristicRef.current) {
      setError('No measurement characteristic available')
      return null
    }

    try {
      const value = await characteristicRef.current.readValue()

      let measurementValue: number
      if (value.byteLength >= 4) {
        measurementValue = value.getFloat32(0, true)
      } else if (value.byteLength >= 2) {
        measurementValue = value.getInt16(0, true) / 100
      } else {
        measurementValue = value.getUint8(0) / 100
      }

      const measurement: BluetoothMeasurement = {
        value: measurementValue,
        unit: 'inches',
        timestamp: new Date(),
        deviceId: device?.id || 'unknown',
      }

      setLastMeasurement(measurement)
      onMeasurement?.(measurement)

      return measurement
    } catch (err) {
      if (err instanceof Error) {
        setError(`Failed to read measurement: ${err.message}`)
      }
      return null
    }
  }, [device, onMeasurement])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gattServerRef.current?.connected) {
        gattServerRef.current.disconnect()
      }
    }
  }, [])

  return {
    isSupported,
    isScanning,
    isConnecting,
    isConnected,
    device,
    lastMeasurement,
    error,
    scan,
    connect,
    disconnect,
    requestMeasurement,
    clearError,
  }
}

// Simulated Bluetooth hook for development/testing
export function useSimulatedBluetooth(options: UseBluetoothOptions = {}): UseBluetoothReturn {
  const { onMeasurement, onConnectionChange } = options

  const [isConnected, setIsConnected] = useState(false)
  const [device, setDevice] = useState<BluetoothDeviceInfo | null>(null)
  const [lastMeasurement, setLastMeasurement] = useState<BluetoothMeasurement | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const scan = useCallback(async () => {
    setIsScanning(true)
    // Simulate scanning delay
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setDevice({
      id: 'simulated-device-001',
      name: 'ICE-GAUGE-PRO (Simulated)',
      connected: false,
      batteryLevel: 85,
    })
    setIsScanning(false)
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setDevice((prev) => (prev ? { ...prev, connected: true } : null))
    setIsConnected(true)
    setIsConnecting(false)
    onConnectionChange?.(true)
  }, [onConnectionChange])

  const disconnect = useCallback(async () => {
    setDevice((prev) => (prev ? { ...prev, connected: false } : null))
    setIsConnected(false)
    onConnectionChange?.(false)
  }, [onConnectionChange])

  const requestMeasurement = useCallback(async () => {
    // Generate a random measurement between 0.5 and 1.5 inches
    const value = 0.5 + Math.random() * 1.0
    const measurement: BluetoothMeasurement = {
      value: Math.round(value * 100) / 100,
      unit: 'inches',
      timestamp: new Date(),
      deviceId: device?.id || 'simulated',
    }
    setLastMeasurement(measurement)
    onMeasurement?.(measurement)
    return measurement
  }, [device, onMeasurement])

  return {
    isSupported: true,
    isScanning,
    isConnecting,
    isConnected,
    device,
    lastMeasurement,
    error: null,
    scan,
    connect,
    disconnect,
    requestMeasurement,
    clearError: () => {},
  }
}
