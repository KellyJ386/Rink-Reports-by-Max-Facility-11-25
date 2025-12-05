// Web Bluetooth API Type Declarations
// These types are not included in standard TypeScript lib

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly service: BluetoothRemoteGATTService
  readonly uuid: string
  readonly properties: BluetoothCharacteristicProperties
  readonly value: DataView | null
  readValue(): Promise<DataView>
  writeValue(value: BufferSource): Promise<void>
  writeValueWithResponse(value: BufferSource): Promise<void>
  writeValueWithoutResponse(value: BufferSource): Promise<void>
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
  addEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void
  removeEventListener(type: 'characteristicvaluechanged', listener: (event: Event) => void): void
}

interface BluetoothCharacteristicProperties {
  readonly broadcast: boolean
  readonly read: boolean
  readonly writeWithoutResponse: boolean
  readonly write: boolean
  readonly notify: boolean
  readonly indicate: boolean
  readonly authenticatedSignedWrites: boolean
  readonly reliableWrite: boolean
  readonly writableAuxiliaries: boolean
}

interface BluetoothRemoteGATTService extends EventTarget {
  readonly device: BluetoothDevice
  readonly uuid: string
  readonly isPrimary: boolean
  getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>
  getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>
}

interface BluetoothRemoteGATTServer {
  readonly device: BluetoothDevice
  readonly connected: boolean
  connect(): Promise<BluetoothRemoteGATTServer>
  disconnect(): void
  getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
  getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
}

interface BluetoothDevice extends EventTarget {
  readonly id: string
  readonly name?: string
  readonly gatt?: BluetoothRemoteGATTServer
  watchAdvertisements(): Promise<void>
  addEventListener(type: 'gattserverdisconnected', listener: (event: Event) => void): void
  removeEventListener(type: 'gattserverdisconnected', listener: (event: Event) => void): void
}

interface BluetoothRequestDeviceFilter {
  services?: BluetoothServiceUUID[]
  name?: string
  namePrefix?: string
  manufacturerData?: { companyIdentifier: number }[]
  serviceData?: { service: BluetoothServiceUUID }[]
}

interface RequestDeviceOptions {
  filters?: BluetoothRequestDeviceFilter[]
  optionalServices?: BluetoothServiceUUID[]
  acceptAllDevices?: boolean
}

interface Bluetooth extends EventTarget {
  getAvailability(): Promise<boolean>
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>
  getDevices(): Promise<BluetoothDevice[]>
}

type BluetoothServiceUUID = number | string
type BluetoothCharacteristicUUID = number | string

interface Navigator {
  bluetooth?: Bluetooth
}

declare global {
  interface Navigator {
    bluetooth?: Bluetooth
  }

  interface Window {
    BluetoothDevice: typeof BluetoothDevice
    BluetoothRemoteGATTServer: typeof BluetoothRemoteGATTServer
    BluetoothRemoteGATTService: typeof BluetoothRemoteGATTService
    BluetoothRemoteGATTCharacteristic: typeof BluetoothRemoteGATTCharacteristic
  }
}

export {}
