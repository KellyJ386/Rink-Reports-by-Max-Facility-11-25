/**
 * Bluetooth Service for Ice Depth Measurement Devices
 *
 * Supports connection to Bluetooth-enabled digital calipers and ice thickness gauges.
 * Uses the Web Bluetooth API available in Chrome, Edge, and Opera.
 */

// Common Bluetooth GATT Service UUIDs for measurement devices
const KNOWN_SERVICES = {
  // Generic measurement devices
  GENERIC_ACCESS: '00001800-0000-1000-8000-00805f9b34fb',
  GENERIC_ATTRIBUTE: '00001801-0000-1000-8000-00805f9b34fb',
  // Battery service (common)
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  // Custom service UUIDs for common caliper brands
  MITUTOYO: '0000fff0-0000-1000-8000-00805f9b34fb',
  FOWLER: '0000ffe0-0000-1000-8000-00805f9b34fb',
  GENERIC_MEASUREMENT: '0000fff0-0000-1000-8000-00805f9b34fb',
}

const MEASUREMENT_CHARACTERISTIC = '0000fff1-0000-1000-8000-00805f9b34fb'

export interface BluetoothDeviceInfo {
  id: string
  name: string
  connected: boolean
}

export interface MeasurementReading {
  value: number
  unit: 'inches' | 'mm'
  timestamp: Date
  deviceId: string
}

type MeasurementCallback = (reading: MeasurementReading) => void
type ConnectionCallback = (device: BluetoothDeviceInfo) => void
type ErrorCallback = (error: Error) => void

class IceDepthBluetoothService {
  private device: BluetoothDevice | null = null
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null
  private measurementCallbacks: Set<MeasurementCallback> = new Set()
  private connectionCallbacks: Set<ConnectionCallback> = new Set()
  private errorCallbacks: Set<ErrorCallback> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3

  /**
   * Check if Web Bluetooth is supported in this browser
   */
  isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  }

  /**
   * Request connection to a Bluetooth measurement device
   */
  async connect(): Promise<BluetoothDeviceInfo> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera.')
    }

    try {
      // Request device with optional services filter
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [KNOWN_SERVICES.GENERIC_MEASUREMENT] },
          { services: [KNOWN_SERVICES.MITUTOYO] },
          { services: [KNOWN_SERVICES.FOWLER] },
          { namePrefix: 'Mitutoyo' },
          { namePrefix: 'Fowler' },
          { namePrefix: 'iGaging' },
          { namePrefix: 'Caliper' },
          { namePrefix: 'Depth' },
        ],
        optionalServices: [
          KNOWN_SERVICES.BATTERY_SERVICE,
          KNOWN_SERVICES.GENERIC_MEASUREMENT,
        ],
      })

      if (!this.device) {
        throw new Error('No device selected')
      }

      // Listen for disconnection
      this.device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnection()
      })

      // Connect to GATT server
      const server = await this.device.gatt?.connect()
      if (!server) {
        throw new Error('Failed to connect to GATT server')
      }

      // Try to get measurement service
      try {
        const service = await server.getPrimaryService(KNOWN_SERVICES.GENERIC_MEASUREMENT)
        this.characteristic = await service.getCharacteristic(MEASUREMENT_CHARACTERISTIC)

        // Subscribe to notifications
        await this.characteristic.startNotifications()
        this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
          this.handleMeasurement(event)
        })
      } catch {
        console.warn('Could not find standard measurement service, device may use custom protocol')
      }

      const deviceInfo: BluetoothDeviceInfo = {
        id: this.device.id,
        name: this.device.name || 'Unknown Device',
        connected: true,
      }

      this.connectionCallbacks.forEach(cb => cb(deviceInfo))
      this.reconnectAttempts = 0

      return deviceInfo
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error connecting to device')
      this.errorCallbacks.forEach(cb => cb(err))
      throw err
    }
  }

  /**
   * Disconnect from the current device
   */
  async disconnect(): Promise<void> {
    if (this.characteristic) {
      try {
        await this.characteristic.stopNotifications()
      } catch {
        // Ignore errors during cleanup
      }
      this.characteristic = null
    }

    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect()
    }

    this.device = null

    this.connectionCallbacks.forEach(cb => cb({
      id: '',
      name: '',
      connected: false,
    }))
  }

  /**
   * Get the current connection status
   */
  getConnectionStatus(): BluetoothDeviceInfo | null {
    if (!this.device) return null

    return {
      id: this.device.id,
      name: this.device.name || 'Unknown Device',
      connected: this.device.gatt?.connected || false,
    }
  }

  /**
   * Manually trigger a measurement read (for devices that don't auto-notify)
   */
  async readMeasurement(): Promise<MeasurementReading | null> {
    if (!this.characteristic) {
      throw new Error('No device connected or characteristic not available')
    }

    try {
      const value = await this.characteristic.readValue()
      return this.parseMeasurement(value)
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to read measurement')
      this.errorCallbacks.forEach(cb => cb(err))
      throw err
    }
  }

  /**
   * Subscribe to measurement readings
   */
  onMeasurement(callback: MeasurementCallback): () => void {
    this.measurementCallbacks.add(callback)
    return () => this.measurementCallbacks.delete(callback)
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback)
    return () => this.connectionCallbacks.delete(callback)
  }

  /**
   * Subscribe to errors
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback)
    return () => this.errorCallbacks.delete(callback)
  }

  /**
   * Simulate a measurement (for testing without a real device)
   */
  simulateMeasurement(value: number): void {
    const reading: MeasurementReading = {
      value,
      unit: 'inches',
      timestamp: new Date(),
      deviceId: 'simulated',
    }
    this.measurementCallbacks.forEach(cb => cb(reading))
  }

  private handleMeasurement(event: Event) {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    const value = target.value
    if (!value) return

    const reading = this.parseMeasurement(value)
    if (reading) {
      this.measurementCallbacks.forEach(cb => cb(reading))
    }
  }

  private parseMeasurement(value: DataView): MeasurementReading | null {
    try {
      // Different calipers use different data formats
      // This attempts to handle common formats

      // Format 1: Simple float (4 bytes)
      if (value.byteLength === 4) {
        const measurement = value.getFloat32(0, true) // Little-endian
        return {
          value: measurement,
          unit: 'inches',
          timestamp: new Date(),
          deviceId: this.device?.id || 'unknown',
        }
      }

      // Format 2: Integer with decimal position (common in Chinese calipers)
      if (value.byteLength >= 2) {
        const rawValue = value.getInt16(0, true)
        const measurement = rawValue / 1000 // Assume mm, convert to proper decimal
        return {
          value: measurement / 25.4, // Convert mm to inches
          unit: 'inches',
          timestamp: new Date(),
          deviceId: this.device?.id || 'unknown',
        }
      }

      // Format 3: ASCII string
      const decoder = new TextDecoder()
      const text = decoder.decode(value)
      const numMatch = text.match(/[\d.]+/)
      if (numMatch) {
        let measurement = parseFloat(numMatch[0])
        // Check if value seems to be in mm (> 10) and convert
        if (measurement > 10) {
          measurement = measurement / 25.4
        }
        return {
          value: measurement,
          unit: 'inches',
          timestamp: new Date(),
          deviceId: this.device?.id || 'unknown',
        }
      }

      return null
    } catch {
      return null
    }
  }

  private async handleDisconnection() {
    console.warn('Bluetooth device disconnected')

    this.connectionCallbacks.forEach(cb => cb({
      id: this.device?.id || '',
      name: this.device?.name || '',
      connected: false,
    }))

    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.device) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)

      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await this.device.gatt?.connect()

        this.connectionCallbacks.forEach(cb => cb({
          id: this.device!.id,
          name: this.device!.name || 'Unknown Device',
          connected: true,
        }))

        this.reconnectAttempts = 0
      } catch {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.errorCallbacks.forEach(cb => cb(new Error('Failed to reconnect after multiple attempts')))
        }
      }
    }
  }
}

// Export singleton instance
export const bluetoothService = new IceDepthBluetoothService()

// React hook for using Bluetooth
export function useBluetoothCaliper() {
  const isSupported = bluetoothService.isSupported()

  return {
    isSupported,
    connect: () => bluetoothService.connect(),
    disconnect: () => bluetoothService.disconnect(),
    getStatus: () => bluetoothService.getConnectionStatus(),
    onMeasurement: (cb: MeasurementCallback) => bluetoothService.onMeasurement(cb),
    onConnectionChange: (cb: ConnectionCallback) => bluetoothService.onConnectionChange(cb),
    onError: (cb: ErrorCallback) => bluetoothService.onError(cb),
    readMeasurement: () => bluetoothService.readMeasurement(),
    simulateMeasurement: (value: number) => bluetoothService.simulateMeasurement(value),
  }
}
